---
layout: default
title: {{ site.blog_name }}
---

<section class="page-intro blog-intro">
    <p class="eyebrow">Central de informações</p>
    <h1>{{ site.blog_name }}</h1>
    <p>{{ site.blog_description }}. Acompanhe aqui as instruções, os candidatos e as novidades do evento.</p>
</section>

<section class="eremita-feature">
    <img src="{{ './static/eremita.png' | relative_url }}" alt="Eremita em meditação" />
    <div>
        <p class="post-date">Sábio de Gensokyo</p>
        <h2>O Eremita</h2>
        <p>Irá supervisionar as eleições para que tudo ocorra bem. mesario top 1 de Gensokyo</p>
    </div>
</section>

<section class="posts-grid">
    <article class="post-card">
        <p class="post-date">Regras</p>
        <h2>Como funciona o token</h2>
        <p>Cada token pode ser usado uma única vez. Depois do voto, ele fica marcado como utilizado.</p>
        <a href="{{ '/about' | relative_url }}">Ler regras</a>
    </article>
</section>
