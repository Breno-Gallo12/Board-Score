# 🎲 BoardScore

![Status do Projeto](https://img.shields.io/badge/Status-Em%20Produ%C3%A7%C3%A3o-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

O **BoardScore** é uma aplicação web multiplayer em tempo real desenhada para gerir, acompanhar e automatizar a pontuação de jogos de tabuleiro. O primeiro módulo lançado traz suporte completo e fiel às regras do famoso jogo **Azul**.

---

## ✨ Funcionalidades Principais

* **Sincronização em Tempo Real:** Toda a sala é sincronizada instantaneamente usando WebSockets. Não é necessário atualizar a página!
* **Leitor de QR Code Nativo:** Entre rapidamente numa sala apontando a câmara do telemóvel para a tela do Host (com interface otimizada e foco automático na câmara traseira).
* **Tabuleiro Interativo & Texturizado:** Grelha tátil que utiliza imagens originais dos azulejos com efeitos de *Glassmorphism*.
* **Motor de Pontuação Automático:** 
  * Validação de jogadas e cancelamentos (Rollback).
  * Gestão de *Floor Line* (penalidades por peças caídas).
  * Cálculo automático de bónus de fim de jogo (Linhas, Colunas e Cores).
* **Mini-Tabuleiros Espião:** Acompanhe a estratégia (e o tabuleiro) dos seus adversários em tempo real na barra lateral.
* **Ecrã de Vitória Épico:** Modal de encerramento cinematográfico que revela o tabuleiro campeão e o pódio final da partida.

---

## 🛠️ Tecnologias Utilizadas

### Backend (API & WebSockets)
* **Java 17+**
* **Spring Boot 3** (Spring Web, Spring Data JPA, Spring WebSocket)
* **H2 Database** (Memória) / PostgreSQL (Produção)

### Frontend (Interface Web & Mobile)
* **React + Vite**
* **Tailwind CSS** (Estilização responsiva e efeitos visuais premium)
* **Axios** (Comunicação HTTP)
* **SockJS + STOMP** (Comunicação WebSocket)
* **Html5-Qrcode** (Leitura de QR Code via câmara)
* **React Router Dom** (Navegação SPA)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* Java JDK 17 ou superior
* Node.js v18 ou superior
* Git

### 1. Iniciar o Backend (Spring Boot)
Navegue até à pasta do backend e execute a aplicação (via Maven ou Gradle):
```bash
cd boardscore
./mvnw spring-boot:run
# O servidor iniciará na porta 8080 (http://localhost:8080)