// PWA Install functionality
let deferredPrompt;
let installButton;

// Create install button
function createInstallButton() {
    if (document.getElementById('install-btn')) return;
    
    installButton = document.createElement('button');
    installButton.id = 'install-btn';
    installButton.innerHTML = '📱 Install App';
    installButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2196F3;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        z-index: 1000;
        transition: all 0.3s ease;
        display: none;
    `;
    
    installButton.addEventListener('mouseover', () => {
        installButton.style.transform = 'scale(1.05)';
        installButton.style.boxShadow = '0 6px 16px rgba(33, 150, 243, 0.4)';
    });
    
    installButton.addEventListener('mouseout', () => {
        installButton.style.transform = 'scale(1)';
        installButton.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
    });
    
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            hideInstallButton();
        }
    });
    
    document.body.appendChild(installButton);
}

function showInstallButton() {
    createInstallButton();
    if (installButton) {
        installButton.style.display = 'block';
        setTimeout(() => {
            installButton.style.opacity = '1';
        }, 100);
    }
}

function hideInstallButton() {
    if (installButton) {
        installButton.style.display = 'none';
    }
}

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt Event fired');
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});

// Listen for app installed event
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    hideInstallButton();
    deferredPrompt = null;
});

// Check if app is already installed
window.addEventListener('load', () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App is running in standalone mode');
        hideInstallButton();
    }
    
    // For iOS devices
    if (window.navigator.standalone === true) {
        console.log('App is running in standalone mode on iOS');
        hideInstallButton();
    }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
