import { createApp } from 'vue';
import App from './App.vue'

const app = createApp(App);
app.config.errorHandler = () => {}; // Accessed on 'app', not 'Vue'

app.mount('#app');
