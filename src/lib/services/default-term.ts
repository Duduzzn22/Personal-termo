/**
 * Termo de demonstração (seção 33 do briefing). Serve apenas como modelo
 * inicial — totalmente editável pelo personal trainer depois de criado.
 */
export const DEFAULT_TERM_TITLE = "Termo de Ciência e Aceite das Condições do Serviço de Personal Training";

export const DEFAULT_TERM_CLAUSES: { titulo: string; conteudo: string }[] = [
  {
    titulo: "1. Objeto do serviço",
    conteudo:
      "O presente termo tem por objetivo registrar a ciência e o aceite do aluno {{aluno_nome}} quanto às condições do serviço de personal training prestado por {{personal_nome}}.",
  },
  {
    titulo: "2. Pacote contratado",
    conteudo:
      "O aluno declara estar ciente de que contratou o pacote {{pacote_nome}}, contendo {{quantidade_aulas}} aulas, e das condições apresentadas no momento da contratação.",
  },
  {
    titulo: "3. Quantidade de aulas",
    conteudo: "O pacote contratado contempla {{quantidade_aulas}} aulas, no valor de {{valor_pacote}}.",
  },
  {
    titulo: "4. Duração das aulas",
    conteudo: "Cada aula terá duração de {{duracao_aula}}, salvo combinação diversa entre as partes.",
  },
  {
    titulo: "5. Agendamento",
    conteudo: "As aulas serão realizadas em dias e horários previamente acordados entre o aluno e o profissional.",
  },
  {
    titulo: "6. Cancelamento com 24 horas de antecedência",
    conteudo: "Cancelamentos deverão ser comunicados com pelo menos 24 horas de antecedência.",
  },
  {
    titulo: "7. Cancelamentos fora do prazo",
    conteudo:
      "Cancelamentos realizados com menos de 24 horas de antecedência poderão ser contabilizados como aula realizada, salvo situações justificadas e avaliadas pelo profissional.",
  },
  {
    titulo: "8. Faltas",
    conteudo:
      "A ausência do aluno sem comunicação prévia poderá ser contabilizada como aula realizada, respeitadas as condições combinadas com o profissional.",
  },
  {
    titulo: "9. Atrasos",
    conteudo: "O atraso do aluno não implica extensão automática do horário originalmente reservado.",
  },
  {
    titulo: "10. Reposição",
    conteudo: "As reposições estarão sujeitas à disponibilidade da agenda do profissional.",
  },
  {
    titulo: "11. Validade do pacote",
    conteudo:
      "As aulas deverão ser utilizadas dentro do período de validade do pacote contratado, de {{validade_pacote}} a partir de {{data_inicio}}.",
  },
  {
    titulo: "12. Pagamento",
    conteudo:
      "O valor do pacote é de {{valor_pacote}}, devendo ser quitado conforme as condições combinadas diretamente com o profissional.",
  },
  {
    titulo: "13. Férias/recesso",
    conteudo:
      "Eventuais períodos de férias ou recesso do profissional serão comunicados ao aluno com antecedência razoável.",
  },
  {
    titulo: "14. Responsabilidade pela comunicação",
    conteudo:
      "É de responsabilidade do aluno manter seus dados de contato atualizados e verificar as comunicações enviadas pelo profissional.",
  },
  {
    titulo: "15. Alteração de horários",
    conteudo: "Alterações de horários fixos deverão ser previamente combinadas entre as partes.",
  },
  {
    titulo: "16. Declaração final de ciência e concordância",
    conteudo:
      "Ao marcar a opção de aceite, o aluno declara ter lido integralmente as condições acima, estar ciente delas e concordar com os termos apresentados.",
  },
];
