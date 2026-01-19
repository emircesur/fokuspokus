// Preload script for secure context bridge
// Add any Node.js APIs you need to expose to the renderer here

window.addEventListener('DOMContentLoaded', () => {
  // Log app info
  console.log('fokuspokus loaded in Electron')
  console.log('Platform:', process.platform)
  
  // Add desktop-specific class for styling if needed
  document.body.classList.add('electron-app')
})
