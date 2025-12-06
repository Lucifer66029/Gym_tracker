// Service Worker for Gym Tracker
self.addEventListener('install', function(event) {
  console.log('Gym Tracker app installed');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Gym Tracker app activated');
  return self.clients.claim();
});