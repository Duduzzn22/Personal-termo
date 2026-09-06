-- Adiciona o evento de auditoria "termo_excluido", usado quando um personal
-- exclui (soft-delete, ativo=false) um modelo de termo na aba Termos.
alter type audit_event_type add value if not exists 'termo_excluido';
