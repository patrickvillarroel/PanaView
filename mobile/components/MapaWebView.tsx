import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import lugaresService from '../services/lugaresService';
import negociosService from '../services/negociosService';
import { Lugar, Negocio } from '../types';

const RADIO_BUSQUEDA = 500; // En desarrollo: 50000 para ver todo Panamá
const DISTANCIA_RECONSULTA = 100;
const INTERVALO_RECONSULTA = 30000;

const COLORES_CATEGORIA: Record<string, string> = {
  'Historia y Cultura': '#E8A838',
  Naturaleza: '#4CAF50',
  Playa: '#2196F3',
  Religioso: '#9C27B0',
  Mirador: '#FF5722',
  Museo: '#795548',
  Gastronomia: '#F44336',
  'Gastronom\u00eda': '#F44336',
  Restaurante: '#F44336',
  Restaurantes: '#F44336',
  Comida: '#F44336',
  Transporte: '#00ACC1',
  Educacion: '#607D8B',
  'Educaci\u00f3n': '#607D8B',
  default: '#607D8B',
};

const PUNTOS_INICIALES = [
  {
    id: 'casco-001',
    nombre: 'Casco Antiguo',
    categoria: { nombre: 'Historia y Cultura', icono: '\uD83C\uDFDB' },
    latitud: 8.9524,
    longitud: -79.5354,
    descripcion: 'Barrio hist\u00f3rico declarado Patrimonio de la Humanidad por la UNESCO.',
  },
  {
    id: 'canal-001',
    nombre: 'Miraflores',
    categoria: { nombre: 'Mirador', icono: '\uD83D\uDD2D' },
    latitud: 9.0046,
    longitud: -79.5797,
    descripcion: 'Esclusas del Canal de Panam\u00e1 con museo y plataforma de observaci\u00f3n.',
  },
];

type PuntoMapa = {
  id: string;
  tipo: 'lugar' | 'negocio';
  nombre: string;
  descripcion?: string;
  categoria: {
    nombre: string;
    icono?: string;
  };
  latitud: number;
  longitud: number;
  distancia_metros?: number;
};

const MAPA_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
  <style>
    @keyframes markerBounce {
      0%   { transform: translateY(-24px) scale(0.75); opacity: 0; }
      55%  { transform: translateY(5px)  scale(1.08); opacity: 1; }
      75%  { transform: translateY(-3px) scale(0.97); }
      100% { transform: translateY(0)    scale(1);    }
    }

    @keyframes clusterPop {
      0%   { transform: scale(0.6); opacity: 0; }
      70%  { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1); }
    }

    @keyframes userPing {
      0%   { transform: scale(1); opacity: 0.55; }
      100% { transform: scale(3.2); opacity: 0; }
    }

    @keyframes popupSlideUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: transparent;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    #map {
      width: 100vw;
      height: 100vh;
      background: #EEF3FB;
    }

    /* Resetear estilos por defecto del plugin cluster */
    .marker-cluster-small,
    .marker-cluster-medium,
    .marker-cluster-large { background: transparent !important; }
    .marker-cluster-small div,
    .marker-cluster-medium div,
    .marker-cluster-large div { background: transparent !important; color: transparent !important; }

    .custom-attribution {
      position: absolute;
      right: 8px;
      bottom: 145px;
      z-index: 800;
      color: #3c4043;
      font-size: 9px;
      opacity: 0.55;
      padding: 3px 7px;
      border-radius: 10px;
      background: rgba(255,255,255,0.82);
      backdrop-filter: blur(4px);
    }

    .leaflet-popup-content-wrapper {
      border-radius: 18px !important;
      box-shadow: 0 6px 28px rgba(26,115,232,0.14), 0 1px 6px rgba(0,0,0,0.06) !important;
      padding: 0 !important;
      overflow: hidden;
      animation: popupSlideUp 200ms cubic-bezier(0.2,0.8,0.25,1);
    }

    .leaflet-popup-tip { display: none !important; }
    .leaflet-popup-content { margin: 0 !important; }

    .user-dot {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #1A73E8;
      border: 3px solid #fff;
      box-shadow: 0 2px 12px rgba(26,115,232,0.65), 0 0 0 2px rgba(26,115,232,0.2);
      position: relative;
      box-sizing: border-box;
    }

    .user-dot::before {
      content: "";
      position: absolute;
      inset: 4px;
      border-radius: 50%;
      background: rgba(255,255,255,0.35);
    }

    .user-dot::after {
      content: "";
      position: absolute;
      inset: -10px;
      border-radius: 50%;
      background: rgba(26,115,232,0.18);
      animation: userPing 2s ease-out infinite;
    }

    .popup-card {
      min-width: 215px;
      max-width: 255px;
      background: #fff;
      overflow: hidden;
    }

    .popup-strip {
      height: 4px;
      width: 100%;
    }

    .popup-inner {
      padding: 13px 15px 15px;
    }

    .popup-cat {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 5px;
    }

    .popup-name {
      font-size: 15px;
      font-weight: 800;
      color: #202124;
      line-height: 1.35;
      margin-bottom: 5px;
    }

    .popup-dist {
      font-size: 12px;
      color: #5F6368;
      margin-bottom: 12px;
    }

    .popup-action {
      border: 0;
      border-radius: 9px;
      color: #fff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      padding: 10px 0;
      width: 100%;
      letter-spacing: 0.1px;
    }

    /* Etiqueta de nombre sobre el marcador */
    .marker-label {
      background: rgba(255,255,255,0.95);
      border-radius: 10px;
      padding: 3px 8px;
      margin-bottom: 4px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.22);
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      max-width: 90px;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
      line-height: 1.4;
    }

    /* Dark mode */
    body.dark #map                           { background: #111827; }
    body.dark .custom-attribution            { background: rgba(17,24,39,0.85); color: #9AA0A6; }
    body.dark .leaflet-popup-content-wrapper { background: #1F2937 !important; box-shadow: 0 6px 28px rgba(0,0,0,0.45), 0 1px 6px rgba(0,0,0,0.25) !important; }
    body.dark .popup-card                    { background: #1F2937; }
    body.dark .popup-name                    { color: #E8EAED; }
    body.dark .popup-dist                    { color: #9AA0A6; }
    body.dark .marker-label                  { background: rgba(31,41,55,0.95); box-shadow: 0 1px 6px rgba(0,0,0,0.42); }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="custom-attribution">&copy; OpenStreetMap contributors &copy; CARTO</div>
  <script>
    (function () {
      function postToRN(data) {
        try {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(data));
        } catch (error) {}
      }

      function reportError(error) {
        postToRN({ type: 'ERROR', mensaje: error && error.message ? error.message : String(error) });
      }

      function loadScript(src, onLoad, onError) {
        var script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = onLoad;
        script.onerror = onError;
        document.head.appendChild(script);
      }

      function loadMarkerCluster(onReady) {
        if (window.L && window.L.MarkerClusterGroup) { onReady(); return; }
        loadScript(
          'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
          onReady,
          function () {
            loadScript(
              'https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
              onReady,
              onReady   // fallback: iniciar sin cluster
            );
          }
        );
      }

      function loadLeaflet() {
        var afterLeaflet = function () { loadMarkerCluster(iniciarMapa); };

        if (window.L) { afterLeaflet(); return; }

        loadScript(
          'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
          afterLeaflet,
          function () {
            loadScript(
              'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
              afterLeaflet,
              function () {
                loadScript(
                  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js',
                  afterLeaflet,
                  function () {
                    reportError(new Error('No se pudo cargar Leaflet. Revisa la conexion del WebView.'));
                  }
                );
              }
            );
          }
        );
      }

      function iniciarMapa() {
      var PUNTOS_INICIALES = ${JSON.stringify(PUNTOS_INICIALES)};
      var COLORES_CATEGORIA = ${JSON.stringify(COLORES_CATEGORIA)};
      var map;
      var marcadorUsuario = null;
      var anilloAccuracy = null;
      var marcadoresLayer = null;
      var userLatLng = null;
      var firstPositionReceived = false;

      function escapeHtml(value) {
        return String(value == null ? '' : value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      function categoriaNombre(lugar) {
        return lugar && lugar.categoria && lugar.categoria.nombre ? lugar.categoria.nombre : 'Turismo';
      }

      function colorCategoria(nombre) {
        return COLORES_CATEGORIA[nombre] || COLORES_CATEGORIA.default;
      }

      function iconoCategoria(lugar) {
        var icono = lugar && lugar.categoria && lugar.categoria.icono ? lugar.categoria.icono : '';
        // Solo usar el icono del backend si es un emoji real (primer char no-ASCII → surrogate pair o plano básico alto)
        if (icono && icono.charCodeAt(0) > 255) return icono;
        var nombre = (categoriaNombre(lugar) || '').toLowerCase();
        if (nombre.indexOf('historia') > -1 || nombre.indexOf('cultura') > -1) return '🏛';
        if (nombre.indexOf('naturaleza') > -1) return '🌿';
        if (nombre.indexOf('playa') > -1) return '🏖';
        if (nombre.indexOf('religio') > -1) return '⛪';
        if (nombre.indexOf('mirador') > -1 || nombre.indexOf('vista') > -1) return '🔭';
        if (nombre.indexOf('museo') > -1) return '🖼';
        if (nombre.indexOf('gastron') > -1 || nombre.indexOf('restaur') > -1 || nombre.indexOf('comida') > -1) return '🍽';
        if (nombre.indexOf('metro') > -1) return '🚇';
        if (nombre.indexOf('transport') > -1) return '🚌';
        if (nombre.indexOf('educaci') > -1) return '🎓';
        if (nombre.indexOf('caf') > -1) return '☕';
        if (nombre.indexOf('hosped') > -1 || nombre.indexOf('hotel') > -1) return '🏨';
        if (nombre.indexOf('artesani') > -1 || nombre.indexOf('souvenir') > -1) return '🎨';
        if (nombre.indexOf('entretenimiento') > -1 || nombre.indexOf('tour') > -1) return '🎭';
        return '📍';
      }

      function normalizarLugar(lugar) {
        return {
          id: String(lugar.id),
          tipo: lugar.tipo || 'lugar',
          nombre: lugar.nombre || 'Sitio',
          descripcion: lugar.descripcion || '',
          categoria: lugar.categoria || { nombre: 'Turismo', icono: '' },
          latitud: Number(lugar.latitud != null ? lugar.latitud : lugar.lat),
          longitud: Number(lugar.longitud != null ? lugar.longitud : lugar.lng),
          distancia_metros: lugar.distancia_metros
        };
      }

      function distanciaMetros(a, b) {
        if (!a || !b) return null;
        var R = 6371000;
        var dLat = (b.lat - a.lat) * Math.PI / 180;
        var dLng = (b.lng - a.lng) * Math.PI / 180;
        var lat1 = a.lat * Math.PI / 180;
        var lat2 = b.lat * Math.PI / 180;
        var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
      }

      function textoDistancia(lugar) {
        var distancia = lugar.distancia_metros;
        if (distancia == null && userLatLng) {
          distancia = distanciaMetros(userLatLng, { lat: lugar.latitud, lng: lugar.longitud });
        }
        if (distancia == null || isNaN(distancia)) return 'Distancia no disponible';
        return distancia >= 1000 ? (distancia / 1000).toFixed(1) + ' km' : Math.round(distancia) + ' m';
      }

      function crearHtmlMarcador(lugar, color, delay) {
        var icono = iconoCategoria(lugar);
        var nombre = lugar.nombre || '';
        var nombreCorto = nombre.length > 16 ? nombre.slice(0, 14) + '…' : nombre;
        return '<div style="' +
          'display:flex;flex-direction:column;align-items:center;' +
          'animation:markerBounce 400ms cubic-bezier(.2,.8,.25,1) ' + delay + 'ms both' +
          '">' +
          // Etiqueta de nombre (estilos base en .marker-label, color dinámico inline)
          '<div class="marker-label" style="color:' + color + '">' + escapeHtml(nombreCorto) + '</div>' +
          // Círculo del icono
          '<div style="' +
          'width:40px;height:40px;border-radius:50%;' +
          'background:' + color + ';border:3px solid #fff;' +
          'box-shadow:0 4px 14px rgba(0,0,0,.30);' +
          'display:flex;align-items:center;justify-content:center;' +
          'font-size:18px;box-sizing:border-box' +
          '">' + icono + '</div>' +
          // Sombra oval en el suelo
          '<div style="' +
          'width:44px;height:10px;border-radius:50%;' +
          'background:rgba(0,0,0,0.18);filter:blur(4px);' +
          'margin-top:3px' +
          '"></div>' +
          '</div>';
      }

      function popupHtml(lugar, color) {
        var categoria = categoriaNombre(lugar);
        var dist = textoDistancia(lugar);
        return '<div class="popup-card">' +
          '<div class="popup-strip" style="background:' + color + '"></div>' +
          '<div class="popup-inner">' +
          '<div class="popup-cat" style="color:' + color + '">' + escapeHtml(categoria) + '</div>' +
          '<div class="popup-name">' + escapeHtml(lugar.nombre) + '</div>' +
          '<div class="popup-dist">' + escapeHtml(dist) + '</div>' +
          '<button class="popup-action" style="background:' + color + '" data-lugar-id="' + escapeHtml(lugar.id) + '" data-tipo="' + escapeHtml(lugar.tipo) + '">Ver detalle →</button>' +
          '</div>' +
          '</div>';
      }

      window.openPunto = function (id, tipo) {
        postToRN({ type: tipo === 'negocio' ? 'OPEN_NEGOCIO' : 'OPEN_LUGAR', id: id });
      };

      document.addEventListener('click', function (event) {
        var btn = event.target && event.target.closest
          ? event.target.closest('.popup-action')
          : (event.target && event.target.className === 'popup-action' ? event.target : null);
        if (btn && btn.dataset && btn.dataset.lugarId) {
          window.openPunto(btn.dataset.lugarId, btn.dataset.tipo);
        }
      });

      window.updateUserPosition = function (lat, lng, accuracy) {
        try {
          var parsedLat = Number(lat);
          var parsedLng = Number(lng);
          var parsedAccuracy = Number(accuracy || 0);
          if (!isFinite(parsedLat) || !isFinite(parsedLng)) return;
          userLatLng = { lat: parsedLat, lng: parsedLng };

          if (!marcadorUsuario) {
            marcadorUsuario = L.marker([parsedLat, parsedLng], {
              icon: L.divIcon({
                html: '<div class="user-dot"></div>',
                className: '',
                iconSize: [22, 22],
                iconAnchor: [11, 11]
              }),
              pane: 'userPane',
              interactive: false
            }).addTo(map);
          } else {
            marcadorUsuario.setLatLng([parsedLat, parsedLng]);
          }

          if (!anilloAccuracy) {
            anilloAccuracy = L.circle([parsedLat, parsedLng], {
              radius: Math.max(parsedAccuracy, 5),
              color: '#1A73E8',
              weight: 0,
              fillColor: '#1A73E8',
              fillOpacity: 0.12,
              interactive: false
            }).addTo(map);
          } else {
            anilloAccuracy.setLatLng([parsedLat, parsedLng]);
            anilloAccuracy.setRadius(Math.max(parsedAccuracy, 5));
          }

          if (!firstPositionReceived) {
            firstPositionReceived = true;
            map.panTo([parsedLat, parsedLng], { animate: true, duration: 0.8 });
          }
        } catch (error) {
          reportError(error);
        }
      };

      window.cargarMarcadores = function (lugaresJSON) {
        try {
          marcadoresLayer.clearLayers();
          var lugares = typeof lugaresJSON === 'string' ? JSON.parse(lugaresJSON) : lugaresJSON;
          if (!Array.isArray(lugares)) lugares = [];

          lugares.map(normalizarLugar).forEach(function (lugar, i) {
            if (!isFinite(lugar.latitud) || !isFinite(lugar.longitud)) return;
            var categoria = categoriaNombre(lugar);
            var color = colorCategoria(categoria);
            var marker = L.marker([lugar.latitud, lugar.longitud], {
              icon: L.divIcon({
                html: crearHtmlMarcador(lugar, color, i * 60),
                className: '',
                iconSize: [90, 77],   // 90 ancho (label), 20 label + 4 gap + 40 círculo + 3 gap + 10 sombra
                iconAnchor: [45, 44], // centro x del icon, centro del círculo desde arriba (20+4+20)
                popupAnchor: [0, -50] // popup sobre la etiqueta
              })
            });

            marker.bindPopup(popupHtml(lugar, color), { closeButton: false, offset: [0, -10] });
            marker.on('click', function () {
              postToRN({ type: 'MARKER_TAP', id: lugar.id, nombre: lugar.nombre });
            });
            marcadoresLayer.addLayer(marker);
          });
        } catch (error) {
          reportError(error);
          try {
            if (lugaresJSON !== JSON.stringify(PUNTOS_INICIALES)) {
              window.cargarMarcadores(JSON.stringify(PUNTOS_INICIALES));
            }
          } catch (fallbackError) {
            reportError(fallbackError);
          }
        }
      };

      window.centrarEnUsuario = function () {
        try {
          if (userLatLng) {
            map.setView([userLatLng.lat, userLatLng.lng], 16, { animate: true });
          }
        } catch (error) {
          reportError(error);
        }
      };

      window.limpiarMarcadores = function () {
        try {
          marcadoresLayer.clearLayers();
        } catch (error) {
          reportError(error);
        }
      };

      try {
        map = L.map('map', {
          center: [8.9524, -79.5354],
          zoom: 14,
          minZoom: 14,
          zoomControl: false,
          attributionControl: false
        });

        var capaTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }).addTo(map);

        var fallbackTilesActivo = false;
        capaTiles.on('tileerror', function () {
          if (fallbackTilesActivo) return;
          fallbackTilesActivo = true;
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
        });

        var hasCluster = typeof L.MarkerClusterGroup !== 'undefined';

        function crearIconoCluster(cluster) {
          var n = cluster.getChildCount();
          var sz = n < 10 ? 46 : n < 50 ? 52 : 60;
          var half = Math.floor(sz / 2);
          var fs = n < 10 ? 16 : 14;
          return L.divIcon({
            html: '<div style="' +
              'width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;' +
              'background:#1A73E8;border:3px solid #fff;' +
              'box-shadow:0 4px 18px rgba(26,115,232,.42);' +
              'display:flex;align-items:center;justify-content:center;' +
              'color:#fff;font-size:' + fs + 'px;font-weight:800;' +
              'box-sizing:border-box;position:relative;' +
              'animation:clusterPop 320ms cubic-bezier(.2,.8,.25,1) both' +
              '"><div style="' +
              'position:absolute;top:-8px;left:-8px;right:-8px;bottom:-8px;' +
              'border-radius:50%;background:rgba(26,115,232,.14);z-index:-1' +
              '"></div>' + n + '</div>',
            className: '',
            iconSize: [sz, sz],
            iconAnchor: [half, half]
          });
        }

        marcadoresLayer = hasCluster
          ? L.markerClusterGroup({
              disableClusteringAtZoom: 16,
              maxClusterRadius: 72,
              spiderfyOnMaxZoom: true,
              showCoverageOnHover: false,
              zoomToBoundsOnClick: false, // manejado manualmente abajo
              chunkedLoading: true,
              iconCreateFunction: crearIconoCluster
            })
          : L.layerGroup();

        marcadoresLayer.addTo(map);

        // Click en cluster: zoom al nivel donde se ven marcadores individuales
        if (hasCluster) {
          marcadoresLayer.on('clusterclick', function (e) {
            // zoomToBounds con maxZoom=16 garantiza llegar al nivel sin clustering
            e.layer.zoomToBounds({ padding: [28, 28], maxZoom: 16 });
          });
        }

        // Pane exclusivo para el dot de usuario: siempre por encima del cluster (markerPane = 600)
        map.createPane('userPane');
        map.getPane('userPane').style.zIndex = 700;
        map.getPane('userPane').style.pointerEvents = 'none';

        // Ocultar marcador de usuario cuando el zoom es muy alejado
        var ZOOM_MIN_USUARIO = 14;
        function actualizarVisibilidadUsuario() {
          var visible = map.getZoom() >= ZOOM_MIN_USUARIO;
          var pane = map.getPane('userPane');
          if (pane) pane.style.display = visible ? '' : 'none';
          if (anilloAccuracy) {
            anilloAccuracy.setStyle({ fillOpacity: visible ? 0.12 : 0 });
          }
        }
        map.on('zoomend', actualizarVisibilidadUsuario);

        window.zoomIn  = function () { try { map.zoomIn();  } catch (e) {} };
        window.zoomOut = function () { try { map.zoomOut(); } catch (e) {} };

        var capaTilesOscura = null;
        window.setTema = function (darkMode) {
          try {
            if (darkMode) {
              document.body.classList.add('dark');
              if (!capaTilesOscura) {
                capaTilesOscura = L.tileLayer(
                  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                  { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors &copy; CARTO' }
                );
              }
              if (!map.hasLayer(capaTilesOscura)) capaTilesOscura.addTo(map);
              if (map.hasLayer(capaTiles)) map.removeLayer(capaTiles);
            } else {
              document.body.classList.remove('dark');
              if (!map.hasLayer(capaTiles)) capaTiles.addTo(map);
              if (capaTilesOscura && map.hasLayer(capaTilesOscura)) map.removeLayer(capaTilesOscura);
            }
          } catch (e) {}
        };

        map.whenReady(function () {
          postToRN({ type: 'MAP_READY' });
        });
      } catch (error) {
        reportError(error);
      }
      }

      loadLeaflet();
    })();
  <\/script>
</body>
</html>
`;

interface Props {
  onLugarPress: (id: string) => void;
}

interface CoordenadasUsuario {
  lat: number;
  lng: number;
  accuracy: number;
}

export default function MapaWebView({ onLugarPress }: Props) {
  const [isDark, setIsDark] = useState(false);
  const ref = useRef<WebView>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const consultaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primeraConsultaRealizadaRef = useRef(false);
  const consultaEnProgresoRef = useRef(false);
  const ultimosPuntosRef = useRef<PuntoMapa[]>([]); // caché del último fetch exitoso
  const reintentoOfflineRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coordenadasRef = useRef<CoordenadasUsuario | null>(null);
  const [coordenadas, setCoordenadas] = useState<CoordenadasUsuario | null>(null);
  const [permiso, setPermiso] = useState<'pendiente' | 'concedido' | 'denegado'>('pendiente');
  const [cargandoSitios, setCargandoSitios] = useState(false);
  const [sitiosCercanos, setSitiosCercanos] = useState(0);
  const [mapaListo, setMapaListo] = useState(false);
  const [offline, setOffline] = useState(false);
  const [ultimaConsulta, setUltimaConsulta] = useState<{ lat: number; lng: number } | null>(null);
  const [errorApi, setErrorApi] = useState<string | null>(null);

  const inyectar = useCallback((script: string) => {
    ref.current?.injectJavaScript(script + '\ntrue;');
  }, []);

  const enviarPosicionAlMapa = useCallback(
    (coords: CoordenadasUsuario) => {
      inyectar(
        `window.updateUserPosition(${coords.lat}, ${coords.lng}, ${coords.accuracy});`
      );
    },
    [inyectar]
  );

  const enviarLugaresAlMapa = useCallback(
    (lugares: PuntoMapa[]) => {
      const payload = JSON.stringify(lugares);
      inyectar(`window.cargarMarcadores(${JSON.stringify(payload)});`);
    },
    [inyectar]
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        switch (data.type) {
          case 'OPEN_LUGAR':
            if (data.id) onLugarPress(data.id);
            break;
          case 'OPEN_NEGOCIO':
            Alert.alert(
              'Negocio cercano',
              'Este restaurante aparece por cercan\u00eda. El detalle de negocios todav\u00eda no tiene pantalla individual.'
            );
            break;
          case 'MAP_READY':
            setMapaListo(true);
            if (coordenadasRef.current) enviarPosicionAlMapa(coordenadasRef.current);
            break;
          case 'MARKER_TAP':
            console.log('Marker tap:', data.id, data.nombre);
            break;
          case 'ERROR':
            Alert.alert('Error del mapa', data.mensaje || 'Ocurri\u00f3 un error inesperado');
            break;
          default:
            break;
        }
      } catch {
        Alert.alert('Error del mapa', 'No se pudo leer un mensaje del mapa');
      }
    },
    [enviarPosicionAlMapa, onLugarPress]
  );

  useEffect(() => {
    let mounted = true;

    async function solicitarPermiso() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;

        if (status !== Location.PermissionStatus.GRANTED) {
          setPermiso('denegado');
          return;
        }

        setPermiso('concedido');
        watcherRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 3000,
          },
          (location) => {
            const nextCoords = {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              accuracy: location.coords.accuracy ?? 0,
            };
            coordenadasRef.current = nextCoords;
            setCoordenadas(nextCoords);
            enviarPosicionAlMapa(nextCoords);
          }
        );

        if (!mounted) {
          watcherRef.current?.remove();
          watcherRef.current = null;
        }
      } catch (error) {
        setPermiso('denegado');
        Alert.alert(
          'Ubicaci\u00f3n no disponible',
          error instanceof Error ? error.message : 'No se pudo iniciar la ubicaci\u00f3n'
        );
      }
    }

    solicitarPermiso();

    return () => {
      mounted = false;
      watcherRef.current?.remove();
      watcherRef.current = null;
      if (consultaTimerRef.current) clearTimeout(consultaTimerRef.current);
      if (reintentoOfflineRef.current) clearInterval(reintentoOfflineRef.current);
    };
  }, [enviarPosicionAlMapa]);

  const consultarSitiosCercanos = useCallback(
    async (coordsParam?: CoordenadasUsuario | null) => {
      // Guard: si ya hay una consulta en vuelo, no lanzar otra
      if (consultaEnProgresoRef.current) return;

      const coords = coordsParam || coordenadasRef.current || coordenadas;
      if (!coords) {
        enviarLugaresAlMapa([]);
        setSitiosCercanos(0);
        return;
      }

      consultaEnProgresoRef.current = true;
      setCargandoSitios(true);
      try {
        const [lugares, negocios] = await Promise.all([
          lugaresService.getLugaresCercanos(coords.lat, coords.lng, RADIO_BUSQUEDA),
          negociosService.getNegociosCercanos(coords.lat, coords.lng, RADIO_BUSQUEDA),
        ]);
        const puntos = combinarPuntosCercanos(lugares, negocios);
        ultimosPuntosRef.current = puntos; // guardar caché
        enviarLugaresAlMapa(puntos);
        setSitiosCercanos(puntos.length);
        setUltimaConsulta({ lat: coords.lat, lng: coords.lng });
        primeraConsultaRealizadaRef.current = true;
        // reconexión exitosa
        setOffline(false);
      } catch (error: any) {
        const sinRed = !error?.response; // sin response = sin internet
        if (sinRed) {
          setOffline(true);
          // mantener los marcadores del último fetch exitoso
          if (ultimosPuntosRef.current.length > 0) {
            enviarLugaresAlMapa(ultimosPuntosRef.current);
            setSitiosCercanos(ultimosPuntosRef.current.length);
          }
        } else {
          // error del servidor — mostrar toast temporal
          const msg = error?.response?.data?.message || 'Error al conectar con el servidor';
          setErrorApi(msg);
        }
      } finally {
        consultaEnProgresoRef.current = false;
        setCargandoSitios(false);
      }
    },
    [coordenadas, enviarLugaresAlMapa]
  );

  useEffect(() => {
    if (!mapaListo) return;
    if (coordenadas) enviarPosicionAlMapa(coordenadas);
    if (!primeraConsultaRealizadaRef.current) {
      consultarSitiosCercanos(coordenadas);
    }
  }, [consultarSitiosCercanos, coordenadas, enviarPosicionAlMapa, mapaListo]);

  useEffect(() => {
    if (!mapaListo) return;
    if (consultaTimerRef.current) clearTimeout(consultaTimerRef.current);
    consultaTimerRef.current = setTimeout(() => {
      consultarSitiosCercanos(coordenadasRef.current);
    }, INTERVALO_RECONSULTA);
    return () => {
      if (consultaTimerRef.current) clearTimeout(consultaTimerRef.current);
    };
  }, [consultarSitiosCercanos, mapaListo, ultimaConsulta]);

  useEffect(() => {
    if (!mapaListo || !coordenadas || !ultimaConsulta) return;
    if (calcularDistanciaMetros(coordenadas, ultimaConsulta) >= DISTANCIA_RECONSULTA) {
      consultarSitiosCercanos(coordenadas);
    }
  }, [consultarSitiosCercanos, coordenadas, mapaListo, ultimaConsulta]);

  // Reintento automático cada 10 segundos mientras está offline
  useEffect(() => {
    if (!offline || !mapaListo) {
      if (reintentoOfflineRef.current) {
        clearInterval(reintentoOfflineRef.current);
        reintentoOfflineRef.current = null;
      }
      return;
    }
    reintentoOfflineRef.current = setInterval(() => {
      consultarSitiosCercanos(coordenadasRef.current);
    }, 10000);
    return () => {
      if (reintentoOfflineRef.current) {
        clearInterval(reintentoOfflineRef.current);
        reintentoOfflineRef.current = null;
      }
    };
  }, [offline, mapaListo, consultarSitiosCercanos]);

  useEffect(() => {
    if (!mapaListo) return;
    inyectar(`window.setTema(${isDark});`);
  }, [isDark, mapaListo, inyectar]);

  useEffect(() => {
    if (!errorApi) return;
    const t = setTimeout(() => setErrorApi(null), 3000);
    return () => clearTimeout(t);
  }, [errorApi]);

  return (
    <View style={[styles.contenedor, isDark && { backgroundColor: '#111827' }]}>
      {permiso === 'denegado' && <BannerSinPermiso isDark={isDark} />}
      <WebView
        ref={ref}
        source={{ html: MAPA_HTML }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        onMessage={handleMessage}
        mixedContentMode="always"
        geolocationEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.loadingMapa, isDark && { backgroundColor: '#111827' }]}>
            <ActivityIndicator color="#1A73E8" size="large" />
          </View>
        )}
      />
      {offline && <BannerOffline />}
      {errorApi && <ToastError mensaje={errorApi} />}
      {cargandoSitios && (
        <View style={styles.pilulaCargaWrapper}>
          <View style={[styles.pilulaCarga, isDark && { backgroundColor: '#1F2937' }]}>
            <ActivityIndicator color="#1A73E8" size="small" />
            <Text style={styles.pilulaCargaTexto}>Buscando sitios…</Text>
          </View>
        </View>
      )}
      <BadgePosicion coordenadas={coordenadas} isDark={isDark} />
      <ZoomControls
        onZoomIn={() => inyectar('window.zoomIn();')}
        onZoomOut={() => inyectar('window.zoomOut();')}
        isDark={isDark}
      />
      <ToggleTema isDark={isDark} onToggle={() => setIsDark(v => !v)} />
      <PanelInferior
        onCentrar={() => inyectar('window.centrarEnUsuario();')}
        onRadar={() => consultarSitiosCercanos(coordenadasRef.current)}
        sitiosCercanos={sitiosCercanos}
        isDark={isDark}
        tienGps={coordenadas !== null}
      />
    </View>
  );
}


function ZoomControls({ onZoomIn, onZoomOut, isDark }: { onZoomIn: () => void; onZoomOut: () => void; isDark?: boolean }) {
  return (
    <View style={[styles.zoomControls, isDark && { backgroundColor: '#1F2937' }]}>
      <TouchableOpacity style={styles.zoomBtn} onPress={onZoomIn} activeOpacity={0.8}>
        <Text style={styles.zoomBtnText}>{'+'}</Text>
      </TouchableOpacity>
      <View style={[styles.zoomDivider, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
      <TouchableOpacity style={styles.zoomBtn} onPress={onZoomOut} activeOpacity={0.8}>
        <Text style={styles.zoomBtnText}>{'−'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ToggleTema({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.toggleTema, isDark && { backgroundColor: '#1F2937' }]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={20}
        color={isDark ? '#FCD34D' : '#1A73E8'}
      />
    </TouchableOpacity>
  );
}

function BannerOffline() {
  return (
    <View style={styles.bannerOffline}>
      <Ionicons name="cloud-offline-outline" size={18} color="#fff" />
      <Text style={styles.bannerOfflineTexto}>
        Sin conexión — mostrando último estado guardado
      </Text>
    </View>
  );
}

function ToastError({ mensaje }: { mensaje: string }) {
  return (
    <View style={styles.toastError}>
      <Ionicons name="alert-circle-outline" size={17} color="#fff" />
      <Text style={styles.toastErrorTexto} numberOfLines={2}>{mensaje}</Text>
    </View>
  );
}

function BannerSinPermiso({ isDark }: { isDark?: boolean }) {
  return (
    <View style={[styles.bannerPermiso, isDark && { backgroundColor: '#1F2937', borderLeftColor: '#1A73E8' }]}>
      <View style={[styles.bannerIconoWrap, isDark && { backgroundColor: 'rgba(26,115,232,0.15)' }]}>
        <Text style={styles.bannerIcono}>{'\ud83d\udccd'}</Text>
      </View>
      <View style={styles.bannerTextoWrap}>
        <Text style={[styles.bannerTitulo, isDark && { color: '#E8EAED' }]}>{'Ubicaci\u00f3n desactivada'}</Text>
        <Text style={[styles.bannerTexto, isDark && { color: '#9AA0A6' }]}>{'Activa tu ubicaci\u00f3n para explorar sitios cercanos'}</Text>
      </View>
      <TouchableOpacity style={styles.bannerBoton} onPress={() => Linking.openSettings()}>
        <Text style={styles.bannerBotonTexto}>{'Activar'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function BadgePosicion({ coordenadas, isDark }: { coordenadas: CoordenadasUsuario | null; isDark?: boolean }) {
  if (!coordenadas) return null;
  const handlePress = () => {
    const texto = `Lat: ${coordenadas.lat}\nLng: ${coordenadas.lng}\nAccuracy: ${Math.round(coordenadas.accuracy)}m`;
    Alert.alert('Tus coordenadas GPS', texto, [
      { text: 'Copiar', onPress: () => console.log(texto) },
      { text: 'Cerrar' }
    ]);
  };
  return (
    <TouchableOpacity
      style={styles.badgePosicion}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.badgePunto} />
      <Text style={styles.badgeTexto} numberOfLines={1}>
        {coordenadas.lat.toFixed(4)}, {coordenadas.lng.toFixed(4)}
      </Text>
      <Text style={styles.badgeSeparador}>{'·'}</Text>
      <Text style={styles.badgeTexto}>{'±'}{Math.round(coordenadas.accuracy)}{'m'}</Text>
    </TouchableOpacity>
  );
}

function PanelInferior({
  onCentrar,
  onRadar,
  sitiosCercanos,
  isDark,
  tienGps,
}: {
  onCentrar: () => void;
  onRadar: () => void;
  sitiosCercanos: number;
  isDark?: boolean;
  tienGps?: boolean;
}) {
  return (
    <View style={[
      styles.panelInferior,
      isDark && { backgroundColor: 'rgba(31,41,55,0.92)', borderColor: 'rgba(255,255,255,0.08)' },
    ]}>
      <View style={styles.panelFila}>

        {/* Bot\u00F3n centrar \u2014 deshabilitado sin GPS */}
        <TouchableOpacity style={[styles.fabCentrar, !tienGps && { opacity: 0.4 }]} onPress={tienGps ? onCentrar : undefined} activeOpacity={0.8}>
          <LinearGradient
            colors={['#1A73E8', '#1565C0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradiente}
          >
            <Ionicons name="locate-outline" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Pill unificada: n\u00FAmero grande | l\u00EDnea | texto */}
        <LinearGradient
          colors={['#1A73E8', '#1558B0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.infoPill}
        >
          <Text style={styles.infoNumero}>{sitiosCercanos}</Text>
          <View style={styles.infoSeparador} />
          <View style={styles.infoTextos}>
            <Text style={styles.infoLabel}>
              {sitiosCercanos === 1 ? 'sitio cercano' : 'sitios cercanos'}
            </Text>
            <Text style={styles.infoSubLabel}>
              {'Radio: '}{(RADIO_BUSQUEDA / 1000).toFixed(1)}{' km'}
            </Text>
          </View>
        </LinearGradient>

        {/* Bot\u00F3n buscar \u2014 \u00EDcono plano */}
        <TouchableOpacity style={styles.botonRadar} onPress={onRadar} activeOpacity={0.8}>
          <LinearGradient
            colors={['#34A853', '#2D8659']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.radarGradiente}
          >
            <Ionicons name="search-outline" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

      </View>
    </View>
  );
}

function combinarPuntosCercanos(lugares: Lugar[], negocios: Negocio[]): PuntoMapa[] {
  const puntosLugar = lugares.map((lugar) => ({
    id: lugar.id,
    tipo: 'lugar' as const,
    nombre: lugar.nombre,
    descripcion: lugar.descripcion,
    categoria: {
      nombre: lugar.categoria?.nombre || 'Turismo',
      icono: lugar.categoria?.icono,
    },
    latitud: Number(lugar.latitud),
    longitud: Number(lugar.longitud),
    distancia_metros: lugar.distancia_metros,
  }));

  const puntosNegocio = negocios.map((negocio) => ({
    id: negocio.id,
    tipo: 'negocio' as const,
    nombre: negocio.nombre,
    descripcion: negocio.descripcion,
    categoria: {
      nombre: negocio.categoria?.nombre || 'Gastronom\u00eda',
      icono: negocio.categoria?.icono || '\uD83C\uDF7D\uFE0F',
    },
    latitud: Number(negocio.latitud),
    longitud: Number(negocio.longitud),
    distancia_metros: negocio.distancia_metros,
  }));

  return [...puntosLugar, ...puntosNegocio]
    .filter((punto) => Number.isFinite(punto.latitud) && Number.isFinite(punto.longitud))
    .sort((a, b) => (a.distancia_metros ?? Infinity) - (b.distancia_metros ?? Infinity));
}

function calcularDistanciaMetros(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const radioTierra = 6371000;
  const dLat = gradosARadianes(b.lat - a.lat);
  const dLng = gradosARadianes(b.lng - a.lng);
  const lat1 = gradosARadianes(a.lat);
  const lat2 = gradosARadianes(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return radioTierra * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function gradosARadianes(value: number) {
  return (value * Math.PI) / 180;
}

const styles = StyleSheet.create({
  // ── Contenedor principal ──────────────────────────────────────
  contenedor: {
    flex: 1,
    backgroundColor: '#E8F0FE',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingMapa: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
  },

  // ── Banner offline ───────────────────────────────────────────
  bannerOffline: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  bannerOfflineTexto: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Banner sin permiso ────────────────────────────────────────
  bannerPermiso: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1A73E8',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  bannerIconoWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcono: {
    fontSize: 20,
  },
  bannerTextoWrap: {
    flex: 1,
  },
  bannerTitulo: {
    fontSize: 13,
    fontWeight: '800',
    color: '#202124',
    marginBottom: 2,
  },
  bannerTexto: {
    fontSize: 12,
    color: '#5F6368',
    lineHeight: 16,
  },
  bannerBoton: {
    backgroundColor: '#1A73E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bannerBotonTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },

  // ── Píldora de carga (top-center) ────────────────────────────
  pilulaCargaWrapper: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    zIndex: 15,
    alignItems: 'center',
  },
  pilulaCarga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  pilulaCargaTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A73E8',
  },

  // ── Toggle tema ───────────────────────────────────────────────
  toggleTema: {
    position: 'absolute',
    left: 16,
    bottom: 132,
    zIndex: 11,
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },

  // ── Zoom controls (right side) ───────────────────────────────
  zoomControls: {
    position: 'absolute',
    right: 16,
    bottom: 132,
    zIndex: 11,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#1A73E8',
    lineHeight: 28,
  },
  zoomDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8EAED',
    marginHorizontal: 10,
  },

  // ── Badge GPS (top-right) ─────────────────────────────────────
  badgePosicion: {
    position: 'absolute',
    top: 14,
    right: 16,
    zIndex: 11,
    borderRadius: 22,
    backgroundColor: 'rgba(17,24,39,0.82)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  badgePunto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#60A5FA',
  },
  badgeTexto: {
    color: '#E8EAED',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeSeparador: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '400',
  },

  // ── Toast error API ──────────────────────────────────────────
  toastError: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B91C1C',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  toastErrorTexto: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Panel inferior flotante estilo Pokémon GO ────────────────
  panelInferior: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    zIndex: 10,
    flexDirection: 'column',
    alignItems: 'stretch',
    // Fondo semitransparente — efecto frosted glass sin librería extra
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingVertical: 14,
    // Sombra pronunciada para el efecto flotante
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 18,
    // Borde sutil que acentúa el glass
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.65)',
  },

  panelFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // FAB Centrar con gradiente
  fabCentrar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },

  fabGradiente: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },


  // Pill unificada (número + separador + texto en gradiente azul)
  infoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
  },

  infoNumero: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    letterSpacing: -0.5,
  },

  infoSeparador: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },

  infoTextos: {
    flex: 1,
  },

  infoLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },

  infoSubLabel: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 11,
    fontWeight: '500',
  },

  // Botón Radar con gradiente
  botonRadar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#34A853',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },

  radarGradiente: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },


});
