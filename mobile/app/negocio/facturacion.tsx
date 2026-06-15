import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import facturacionService, {
  CicloFacturacion,
  CanjeHistorial,
  ResumenNegocio,
} from '../../services/facturacionService';
import { COLORES, ESPACIADO, TAMAÑOS, BORDES } from '../../constants/config';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMonto(n: number) {
  return `$${(n ?? 0).toFixed(2)}`;
}

const ESTADO_CONFIG = {
  activo:         { label: 'Activo',          color: '#059669', fondo: '#D1FAE5' },
  pendiente_pago: { label: 'Pendiente de pago', color: '#D97706', fondo: '#FEF3C7' },
  pagado:         { label: 'Pagado',           color: '#2563EB', fondo: '#DBEAFE' },
  vencido:        { label: 'Vencido',          color: '#DC2626', fondo: '#FEE2E2' },
} as const;

function ChipEstado({ estado }: { estado: keyof typeof ESTADO_CONFIG }) {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.activo;
  return (
    <View style={[styles.chip, { backgroundColor: cfg.fondo }]}>
      <Text style={[styles.chipTexto, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Tarjeta ciclo ────────────────────────────────────────────────────────────

function TarjetaCiclo({ ciclo, destacada = false }: { ciclo: CicloFacturacion; destacada?: boolean }) {
  return (
    <View style={[styles.tarjetaCiclo, destacada && styles.tarjetaCicloDestacada]}>
      <View style={styles.tarjetaCicloHeader}>
        <Text style={styles.tarjetaCicloTipo}>
          Ciclo {ciclo.tipo === 'quincenal' ? 'quincenal' : 'mensual'}
        </Text>
        <ChipEstado estado={ciclo.estado} />
      </View>

      <Text style={styles.tarjetaCicloFechas}>
        {formatFecha(ciclo.fecha_inicio)} → {formatFecha(ciclo.fecha_fin)}
      </Text>

      <View style={styles.tarjetaCicloStats}>
        <View style={styles.statBloque}>
          <Text style={styles.statBloqueValor}>{ciclo.total_canjeos}</Text>
          <Text style={styles.statBloqueLabel}>Canjeos</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statBloque}>
          <Text style={[styles.statBloqueValor, { color: COLORES.primario }]}>
            {formatMonto(+ciclo.total_comisiones)}
          </Text>
          <Text style={styles.statBloqueLabel}>Comisión</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statBloque}>
          <Text style={styles.statBloqueLabel}>Vence</Text>
          <Text style={styles.statBloqueValorPequeno}>{formatFecha(ciclo.fecha_vencimiento)}</Text>
        </View>
      </View>

      {(ciclo.estado === 'pendiente_pago' || ciclo.estado === 'vencido') && (
        <View style={styles.alertaPane}>
          <Ionicons
            name={ciclo.estado === 'vencido' ? 'warning' : 'time-outline'}
            size={15}
            color={ciclo.estado === 'vencido' ? '#DC2626' : '#D97706'}
          />
          <Text style={[styles.alertaTexto, ciclo.estado === 'vencido' && { color: '#DC2626' }]}>
            {ciclo.estado === 'vencido'
              ? 'Tus promociones están pausadas por pago pendiente. Contacta a PanaView para regularizar.'
              : `Tienes hasta el ${formatFecha(ciclo.fecha_vencimiento)} para pagar. Después se pausarán tus promociones.`}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Tarjeta canje ────────────────────────────────────────────────────────────

function TarjetaCanje({ item }: { item: CanjeHistorial }) {
  return (
    <View style={styles.tarjetaCanje}>
      <View style={{ flex: 1 }}>
        <Text style={styles.canjePromo} numberOfLines={1}>
          {item.promocion?.nombre ?? 'Promoción'}
        </Text>
        <Text style={styles.canjeDetalle}>
          {item.usuario?.nombre ?? 'Cliente'} · {item.metodo === 'qr_scan' ? 'QR' : 'App'}
        </Text>
        <Text style={styles.canjeFecha}>{formatFecha(item.canjeado_en)}</Text>
      </View>
      <Text style={styles.canjeComision}>{formatMonto(+item.monto_comision)}</Text>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function FacturacionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { negocioId } = useLocalSearchParams<{ negocioId: string }>();

  const [resumen, setResumen] = useState<ResumenNegocio | null>(null);
  const [canjeos, setCanjeos] = useState<CanjeHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [tabActiva, setTabActiva] = useState<'ciclos' | 'canjeos'>('ciclos');

  const cargar = useCallback(async () => {
    if (!negocioId) return;
    try {
      const [res, can] = await Promise.all([
        facturacionService.resumenNegocio(negocioId),
        facturacionService.historialCanjeos(negocioId),
      ]);
      setResumen(res);
      setCanjeos(can);
    } catch {
      // el usuario verá estado vacío
    }
  }, [negocioId]);

  useEffect(() => {
    cargar().finally(() => setCargando(false));
  }, [cargar]);

  const onRefresh = async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  };

  if (cargando) {
    return (
      <View style={[styles.centrado, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORES.primario} />
      </View>
    );
  }

  const stats = resumen?.estadisticas;

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={COLORES.primario} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Facturación</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={COLORES.primario} />}
      >
        {/* Resumen financiero */}
        {stats && (
          <View style={styles.resumenRow}>
            <View style={[styles.resumenCard, { borderLeftColor: '#059669' }]}>
              <Text style={styles.resumenValor}>{formatMonto(stats.totalGenerado)}</Text>
              <Text style={styles.resumenLabel}>Total pagado</Text>
            </View>
            <View style={[styles.resumenCard, { borderLeftColor: '#D97706' }]}>
              <Text style={[styles.resumenValor, stats.totalAdeudado > 0 && { color: '#D97706' }]}>
                {formatMonto(stats.totalAdeudado)}
              </Text>
              <Text style={styles.resumenLabel}>Por pagar</Text>
            </View>
          </View>
        )}

        {/* Aviso canjeos anteriores al sistema */}
        {(resumen?.estadisticas.canjeosSinCiclo ?? 0) > 0 && (
          <View style={[styles.infoBox, { marginHorizontal: ESPACIADO.lg, marginTop: ESPACIADO.lg }]}>
            <Ionicons name="information-circle-outline" size={16} color={COLORES.primario} />
            <Text style={styles.infoTexto}>
              Tienes {resumen!.estadisticas.canjeosSinCiclo} canjeo(s) anteriores al sistema de facturación.
              Puedes verlos en la pestaña "Historial de canjeos".
            </Text>
          </View>
        )}

        {/* Aviso ciclo activo / vencido */}
        {resumen?.cicloActual && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Ciclo actual</Text>
            <TarjetaCiclo ciclo={resumen.cicloActual} destacada />
          </View>
        )}

        {/* Tabs historial / canjeos */}
        <View style={styles.tabs}>
          {(['ciclos', 'canjeos'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tabActiva === t && styles.tabBtnActivo]}
              onPress={() => setTabActiva(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnTexto, tabActiva === t && styles.tabBtnTextoActivo]}>
                {t === 'ciclos' ? 'Historial de ciclos' : 'Historial de canjeos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tabActiva === 'ciclos' ? (
          <View style={styles.seccion}>
            {(resumen?.historial ?? []).filter((c) => c.estado !== 'activo').length === 0 ? (
              <Text style={styles.vacio}>Aún no hay ciclos anteriores</Text>
            ) : (
              (resumen?.historial ?? [])
                .filter((c) => c.estado !== 'activo')
                .map((c) => <TarjetaCiclo key={c.id} ciclo={c} />)
            )}
          </View>
        ) : (
          <View style={styles.seccion}>
            {canjeos.length === 0 ? (
              <Text style={styles.vacio}>No hay canjeos registrados aún</Text>
            ) : (
              canjeos.map((c) => <TarjetaCanje key={c.id} item={c} />)
            )}
          </View>
        )}

        {/* Info modelo */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORES.primario} />
          <Text style={styles.infoTexto}>
            Solo pagas cuando un cliente canjea una de tus promociones. La comisión se calcula
            automáticamente sobre el valor de cada promoción canjeada.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F4F6FB' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACIADO.lg,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EAED',
  },
  headerTitulo: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '800',
    color: COLORES.primario,
  },

  resumenRow: {
    flexDirection: 'row',
    gap: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.lg,
    paddingTop: ESPACIADO.lg,
  },
  resumenCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: BORDES.redondeadoGrande,
    padding: ESPACIADO.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  resumenValor: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORES.texto,
    marginBottom: 2,
  },
  resumenLabel: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
    fontWeight: '500',
  },

  seccion: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.lg },
  seccionTitulo: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORES.textoBorrado,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: ESPACIADO.md,
  },

  tarjetaCiclo: {
    backgroundColor: '#fff',
    borderRadius: BORDES.redondeadoGrande,
    padding: ESPACIADO.lg,
    marginBottom: ESPACIADO.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tarjetaCicloDestacada: {
    borderWidth: 1.5,
    borderColor: COLORES.acento,
  },
  tarjetaCicloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tarjetaCicloTipo: {
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '700',
    color: COLORES.texto,
  },
  tarjetaCicloFechas: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
    marginBottom: ESPACIADO.md,
  },
  tarjetaCicloStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBloque: { flex: 1, alignItems: 'center' },
  statBloqueValor: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORES.texto,
  },
  statBloqueValorPequeno: {
    fontSize: TAMAÑOS.fontoPequeno,
    fontWeight: '600',
    color: COLORES.texto,
    textAlign: 'center',
  },
  statBloqueLabel: {
    fontSize: 11,
    color: COLORES.textoBorrado,
    marginTop: 2,
  },
  statSep: { width: 1, height: 36, backgroundColor: '#E8EAED' },

  alertaPane: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: BORDES.redondeado,
    padding: ESPACIADO.md,
    marginTop: ESPACIADO.md,
  },
  alertaTexto: {
    flex: 1,
    fontSize: TAMAÑOS.fontoPequeno,
    color: '#D97706',
    lineHeight: 18,
  },

  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  chipTexto: {
    fontSize: 11,
    fontWeight: '700',
  },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: ESPACIADO.lg,
    marginTop: ESPACIADO.lg,
    backgroundColor: '#E8EAED',
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActivo: { backgroundColor: '#fff' },
  tabBtnTexto: { fontSize: 13, color: COLORES.textoBorrado, fontWeight: '600' },
  tabBtnTextoActivo: { color: COLORES.primario, fontWeight: '700' },

  tarjetaCanje: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BORDES.redondeadoGrande,
    padding: ESPACIADO.md,
    marginBottom: ESPACIADO.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  canjePromo: {
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '700',
    color: COLORES.texto,
  },
  canjeDetalle: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
    marginTop: 2,
  },
  canjeFecha: {
    fontSize: 11,
    color: COLORES.textoBorrado,
    marginTop: 2,
  },
  canjeComision: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORES.primario,
    marginLeft: ESPACIADO.md,
  },

  vacio: {
    textAlign: 'center',
    color: COLORES.textoBorrado,
    fontSize: TAMAÑOS.fontoNormal,
    paddingVertical: ESPACIADO.xl,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    margin: ESPACIADO.lg,
    backgroundColor: COLORES.acento,
    borderRadius: BORDES.redondeadoGrande,
    padding: ESPACIADO.md,
  },
  infoTexto: {
    flex: 1,
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.primario,
    lineHeight: 18,
  },
});
