# Plano de Implementação Supabase — Mercavejo Productivity

Este documento descreve as alterações necessárias para integrar o Supabase ao projeto, substituindo ou complementando o `localStorage`.

## 1. Estrutura do Banco de Dados (Supabase)

Tabela: `tasks`
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `uuid` | Chave primária (gerada automaticamente) |
| `user_id` | `uuid` | ID do usuário (vinculado ao `auth.users`) |
| `task_name` | `text` | Nome da tarefa |
| `company` | `text` | Nome da empresa |
| `duration` | `integer` | Duração em segundos |
| `timestamp` | `timestamp with time zone` | Data e hora da tarefa |
| `created_at` | `timestamp with time zone` | Data de criação no banco |

## 2. Novos Arquivos

- `src/lib/supabase.ts`: Configuração do cliente Supabase.
- `src/hooks/useTasks.ts`: Hook personalizado para gerenciar tarefas (Supabase + LocalStorage fallback).
- `src/components/AuthProvider.tsx`: Contexto para gerenciar o estado de autenticação.

## 3. Alterações nos Componentes Existentes

- `src/pages/Home.tsx`: Atualizar para usar o hook `useTasks`.
- `src/pages/Dashboard.tsx`: Atualizar para buscar dados do Supabase.
- `src/pages/Historico.tsx`: Atualizar para buscar dados do Supabase.
- `src/components/Header.tsx`: Adicionar botões de Login/Logout.

## 4. Estratégia de Sincronização

1. **Offline First**: Continuar salvando no `localStorage` para garantir que o usuário não perca dados se a conexão falhar.
2. **Sincronização**: Se o usuário estiver logado, os dados são enviados para o Supabase.
3. **Migração**: Ao fazer login pela primeira vez, oferecer a opção de subir os dados do `localStorage` para a nuvem.
