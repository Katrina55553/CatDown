import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PetApp from './components/PetApp.vue'

const app = createApp(PetApp)
app.use(createPinia())
app.mount('#pet-app')
