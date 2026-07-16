# Doceria Floripa V3 — HTML/CSS/JS + Firebase

Esta versão mantém o projeto em HTML, CSS e JavaScript puro, mas adiciona um painel administrativo para a cliente cadastrar produtos sem mexer no código.

## Arquivos principais

- `index.html`: site público.
- `style.css`: visual do site público.
- `script.js`: menu mobile e carregamento dos produtos do Firebase.
- `admin.html`: painel privado da cliente.
- `admin.css`: visual do painel.
- `admin.js`: login, cadastro, edição, ocultação e exclusão de produtos.
- `firebase-config.js`: configuração do seu projeto Firebase.
- `firestore.rules.txt`: regras de segurança sugeridas para o Firestore.

## O que a cliente consegue fazer

- Fazer login no painel.
- Adicionar produto.
- Editar produto.
- Excluir produto.
- Ocultar produto sem excluir.
- Marcar produto como “Mais pedido”.
- Colocar link de WhatsApp, cardápio, Drive ou outro link.
- Usar imagem local, como `img/brownie.png`, ou imagem por URL.

## Passo 1 — Criar o projeto no Firebase

1. Acesse o Firebase Console.
2. Crie um novo projeto.
3. Adicione um app Web.
4. Copie a configuração do SDK.
5. Cole esses dados no arquivo `firebase-config.js`.

Exemplo do local onde colar:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

## Passo 2 — Ativar login por e-mail e senha

1. No Firebase, vá em Authentication.
2. Clique em Sign-in method.
3. Ative Email/Password.
4. Crie o usuário da cliente manualmente em Users.

Esse e-mail e senha serão usados no `admin.html`.

## Passo 3 — Criar o banco Firestore

1. No Firebase, vá em Firestore Database.
2. Crie o banco.
3. Comece em modo produção.
4. Vá em Rules.
5. Cole o conteúdo de `firestore.rules.txt`.

Essas regras deixam qualquer pessoa ler os produtos no site público, mas só usuários logados conseguem criar, editar ou excluir produtos.

## Passo 4 — Rodar localmente

Como o projeto usa módulos JavaScript, abra com servidor local. Não abra só clicando no HTML.

Se tiver Python instalado:

```bash
python -m http.server 5500
```

Depois acesse:

```txt
http://localhost:5500
```

Painel:

```txt
http://localhost:5500/admin.html
```

## Passo 5 — Publicar na Vercel

Pode publicar como site estático normal.

Arquivos que precisam ir para o GitHub:

```txt
index.html
style.css
script.js
admin.html
admin.css
admin.js
firebase-config.js
firestore.rules.txt
img/
```

## Observação sobre imagens

Nesta versão, o painel usa campo de link da imagem.

Você pode usar:

```txt
img/brownie.png
```

Ou uma URL externa:

```txt
https://exemplo.com/imagem.jpg
```

Uma próxima melhoria seria adicionar upload direto de imagem usando Firebase Storage.
