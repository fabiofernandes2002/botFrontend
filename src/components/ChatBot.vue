<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" app dark width="300">
      <v-btn color="primary" class="btn-nova-conversa" @click="startNewConversation">
        Nova Conversa
      </v-btn>
      <v-subheader class="historico-conversa">Histórico das Conversas</v-subheader>
      <v-list dense>
        <template v-for="(conversations, date) in groupedConversations" :key="date">
          <v-subheader class="text-subheader">{{ date }}</v-subheader>
          <v-list-item v-for="history in conversations" :key="history.id">
            <v-list-item-content>
              <v-list-item-title class="text-primary">{{ history.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app dense color="indigo" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" color="white"></v-app-bar-nav-icon>
      <v-toolbar-title class="extra-bold-title">Helpdesk Virtual</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" md="8" :class="{ 'offset-md-1': drawer }">
            <v-card>
              <v-card-title v-if="!messages.length">Bem Vindo ao Helpdesk Virtual, em que posso ajudar?</v-card-title>
              <v-card-text class="message-container">
                <div v-for="message in messages" :key="message.id" class="message-wrapper">
                  <div v-if="message.sender === 'Bot'" class="message bot-message">
                    <v-chip color="blue" class="message-title" dark>Bot</v-chip>
                    <div class="message-content">
                      <span v-html="message.content" class="botMessage"></span>
                      <div class="feedback-icons">
                        <v-icon small @click="handleFeedback('like')">mdi-thumb-up</v-icon>
                        <v-icon small @click="handleFeedback('dislike')">mdi-thumb-down</v-icon>
                      </div>
                    </div>
                  </div>
                  <div v-else class="message user-message">
                    <v-chip color="green" class="message-title" dark>{{ message.sender }}</v-chip>
                    <div class="message-content">
                      <span>{{ message.content }}</span>
                    </div>
                  </div>
                </div>
                <!-- Vídeo de animação do bot -->
                <!-- <video v-if="showBotAnimation" ref="botAnimation" class="bot-animation" :src="botAnimationSource" autoplay @ended="hideBotAnimation"></video> -->
              </v-card-text>
              <v-card-actions>
                <v-text-field
                  v-model="newMessage"
                  label="Escreva uma mensagem..."
                  outlined
                  dense
                  class="flex-grow-1 text-input"
                  @keyup.enter="sendMessage"
                ></v-text-field>
                <v-btn color="primary" class="rounded-btn" @click="sendMessage">Enviar</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    
    <!-- Imagem do bot posicionada fora do container, mas alinhada com as mensagens do bot -->
    <!-- <img v-if="hasBotMessage" class="bot-image" :src="robotImage" alt="Bot" /> -->

    <!-- Vídeo de animação do bot -->
    <video v-if="showBotAnimation" ref="botAnimation" class="bot-animation" :src="botAnimationSource" autoplay @ended="hideBotAnimation"></video>
  </v-app>
</template>

<script>
  import axios from 'axios';
  import { useStore } from '../stores';
  import { mapActions, mapState } from 'pinia';
  import BotImage from '@/assets/robotCleanUp.png';
  import HappyBotAnimation from '@/assets/RobotHappy.mp4';
  import SadBotAnimation from '@/assets/RobotSad.mp4';

  // Importando a fonte Poppins do Google Fonts
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700;800&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  export default {
    data() {
      return {
        drawer: false,
        messages: [],
        newMessage: '',
        robotImage: BotImage,
        showBotAnimation: false,
        botAnimationSource: ''
      };
    },
    computed: {
      ...mapState(useStore, ['conversationHistory']),
      groupedConversations() {
        return this.groupConversationsByDate();
      },
      hasBotMessage() {
        return this.messages.some(message => message.sender === 'Bot');
      }
    },
    methods: {
      ...mapActions(useStore, ['addConversation']),
      
      sendMessage() {
        if (this.newMessage.trim()) {
          this.messages.push({
            sender: 'Eu',
            content: this.newMessage,
            id: Date.now()
          });
          this.sendToServer(this.newMessage);
          this.newMessage = '';
        }
      },
      async sendToServer(message) {
        try {
          const response = await axios.post('http://localhost:3000/webhook', { message });
          if (response.data && response.data.message) {
            this.messages.push({
              sender: 'Bot',
              content: response.data.message,
              id: Date.now()
            });
          }
        } catch (error) {
          console.error('Error in sending message to server', error);
          this.messages.push({
            sender: 'Bot',
            content: 'Erro ao conectar com o servidor.',
            id: Date.now()
          });
        }
      },
      startNewConversation() {
        if (this.messages.length > 0) {
          const lastMessage = this.messages[this.messages.length - 1];
          this.addConversation({
            date: new Date(),
            title: lastMessage.content.substring(0, 30) + '...',
            id: Date.now()
          });
        }
        this.messages = []; 
      },
      formatDate(date) {
        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
          return 'Hoje';
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
          return 'Ontem';
        } else {
          return messageDate.toLocaleDateString();
        }
      },
      groupConversationsByDate() {
        const grouped = {};
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        this.conversationHistory.forEach(convo => {
          const convoDate = new Date(convo.date);
          let dateKey = convoDate.toLocaleDateString();

          if (convoDate.toDateString() === today.toDateString()) {
            dateKey = 'Hoje';
          } else if (convoDate.toDateString() === yesterday.toDateString()) {
            dateKey = 'Ontem';
          } else if (convoDate >= sevenDaysAgo) {
            dateKey = 'Últimos 7 Dias';
          }

          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }

          grouped[dateKey].push(convo);
        });

        return grouped;
      },
      handleFeedback(feedbackType) {
        if (feedbackType === 'like') {
          this.botAnimationSource = HappyBotAnimation;
        } else if (feedbackType === 'dislike') {
          this.botAnimationSource = SadBotAnimation;
        }
        this.showBotAnimation = true;
      },
      hideBotAnimation() {
        this.showBotAnimation = false;
        this.botAnimationSource = '';
      }
    }
  };
</script>

<style scoped>
  .v-main {
    height: 100vh !important;
    background-color: #E8EAF6;
    font-family: 'Poppins', sans-serif;
  }

  .btn-nova-conversa {
    margin-top: 70px;
    margin-bottom: 30px;
    margin-left: 20px;
    background-color: #4922D9;
    border-radius: 25px;
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-weight: bold;
  }

  .historico-conversa {
    margin-left: 60px;
    margin-top: 10px;
    font-weight: bold;
    color: #000;
    font-family: 'Poppins', sans-serif;
    font-weight: bold;
  }

  .text-input {
    background-color: #ffffff;
    border-radius: 25px;
    padding: 10px;
    font-family: 'Poppins', sans-serif;
  }

  .rounded-btn {
    background-color: #4922D9;
    border-radius: 25px;
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-weight: bold;
  }

  .text-white {
    color: #ffffff !important;
  }

  .text-subheader {
    color: #000 !important;
    font-family: 'Poppins', sans-serif;
    font-weight: bold;
    margin-left: 20px;
  }

  .text-primary {
    color: #000 !important;
    font-family: 'Poppins', sans-serif;
  }

  .v-btn {
    color: #ffffff !important;
  }

  .extra-bold-title {
    font-weight: 800;
    font-family: 'Poppins', sans-serif;
  }

  .message-container {
    height: 400px;
    overflow-y: auto;
    background-color: #F5F5F5;
    position: relative;
    padding: 20px;
  }

  .message-wrapper {
    display: flex;
    align-items: flex-start;
    margin-bottom: 10px;
    width: 100%;
  }

  .message {
    display: flex;
    align-items: flex-start;
    width: 100%;
  }

  .bot-message,
  .user-message {
    display: flex;
    align-items: flex-start;
  }

  .bot-animation {
    position: absolute;
    top: 180px;
    left: 10px;
    width: 100%;
    max-width: 250px;
    border: none;
    outline: none;
    background-color: transparent !important;
  
  }

  span {
    margin-left: 10px;
  }

  .feedback-icons {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .message-content {
    display: flex;
    flex-direction: column;
    word-wrap: break-word;
    max-width: 70%;
  }

  .message-title {
    margin-right: 10px;
  }
</style>

