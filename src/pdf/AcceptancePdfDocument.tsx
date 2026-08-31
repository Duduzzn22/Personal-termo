import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCurrencyFromCents, formatDateBR, formatTimeBR } from "@/lib/utils/format";
import type { Acceptance, DocumentSnapshot } from "@/types/database";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    padding: 12,
    marginBottom: 18,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 8,
    color: "#94a3b8",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 4,
  },
  clause: {
    marginBottom: 10,
  },
  clauseTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  clauseContent: {
    fontSize: 9.5,
    lineHeight: 1.5,
    color: "#334155",
  },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  footerText: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 3,
  },
  hash: {
    fontSize: 7,
    color: "#cbd5e1",
    marginTop: 10,
  },
});

export function AcceptancePdfDocument({
  acceptance,
  snapshot,
}: {
  acceptance: Acceptance;
  snapshot: DocumentSnapshot;
}) {
  return (
    <Document title={`Comprovante de Aceite ${acceptance.protocolo}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>COMPROVANTE DE CIÊNCIA E ACEITE</Text>
        <Text style={styles.subtitle}>
          {snapshot.termo_titulo} — Versão {snapshot.termo_versao}
        </Text>

        <View style={styles.infoBox}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Personal Trainer</Text>
            <Text style={styles.infoValue}>{snapshot.personal.nome_profissional}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Aluno</Text>
            <Text style={styles.infoValue}>{snapshot.aluno.nome_completo}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Pacote</Text>
            <Text style={styles.infoValue}>{snapshot.pacote.nome}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Quantidade de aulas</Text>
            <Text style={styles.infoValue}>{snapshot.pacote.quantidade_aulas}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Valor</Text>
            <Text style={styles.infoValue}>{formatCurrencyFromCents(snapshot.pacote.valor_centavos)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Data</Text>
            <Text style={styles.infoValue}>{formatDateBR(acceptance.accepted_at)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Horário</Text>
            <Text style={styles.infoValue}>{formatTimeBR(acceptance.accepted_at)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Protocolo</Text>
            <Text style={styles.infoValue}>{acceptance.protocolo}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>CONDIÇÕES ACEITAS</Text>
        {snapshot.clausulas.map((clause, idx) => (
          <View key={idx} style={styles.clause} wrap={false}>
            <Text style={styles.clauseTitle}>{clause.titulo}</Text>
            <Text style={styles.clauseContent}>{clause.conteudo}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Declaração de aceite registrada eletronicamente.</Text>
          <Text style={styles.footerText}>
            Protocolo: {acceptance.protocolo} — {formatDateBR(acceptance.accepted_at)} às{" "}
            {formatTimeBR(acceptance.accepted_at)} ({acceptance.timezone})
          </Text>
          <Text style={styles.hash}>Hash do documento (SHA-256): {acceptance.document_hash}</Text>
        </View>
      </Page>
    </Document>
  );
}
