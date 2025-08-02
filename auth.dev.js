import { main } from "./main.js";

// Simple auth stub for development without Supabase.
function initDevAuth() {
  // Pretend the admin user is signed in so that all features are accessible.
  localStorage.setItem("familyCurrentUser", "Ghassan");
  document.body.dataset.user = "dev";

  const authContainer = document.getElementById("authContainer");
  const profileMenuBtn = document.getElementById("profileMenuBtn");
  const signOutBtn = document.getElementById("signOutBtn");

  if (authContainer) authContainer.hidden = true;
  if (profileMenuBtn) profileMenuBtn.hidden = false;
  if (signOutBtn) signOutBtn.hidden = true;

  // Load the app using default/local data only.
  main();
}

initDevAuth();
