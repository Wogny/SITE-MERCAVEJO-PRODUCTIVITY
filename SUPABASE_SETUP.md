# Guia de Configuração do Supabase

Para que a integração funcione corretamente, você precisa configurar seu projeto no Supabase seguindo estes passos:

## 1. Criar a Tabela de Tarefas

No Editor SQL do seu painel do Supabase, execute o seguinte comando para criar a tabela `tasks`:

```sql
-- Criar a tabela de tarefas
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_name text not null,
  company text not null,
  duration integer not null,
  timestamp timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);

-- Habilitar Row Level Security (RLS)
alter table public.tasks enable row level security;

-- Criar política para permitir que usuários vejam apenas suas próprias tarefas
create policy "Users can view their own tasks"
  on public.tasks for select
  using ( auth.uid() = user_id );

-- Criar política para permitir que usuários insiram suas próprias tarefas
create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check ( auth.uid() = user_id );

-- Criar política para permitir que usuários deletem suas próprias tarefas
create policy "Users can delete their own tasks"
  on public.tasks for delete
  using ( auth.uid() = user_id );
```

## 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do seu projeto (use o `.env.example` como base) e adicione suas credenciais:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

Você pode encontrar essas informações em **Project Settings > API** no painel do Supabase.

## 3. Autenticação

A implementação atual usa **Magic Links** (Email OTP ). Certifique-se de que o provedor de Email está habilitado em **Authentication > Providers** no Supabase.

