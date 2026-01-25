import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Import plugin mới

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Thêm vào đây, không cần file config riêng nữa
  ],
})