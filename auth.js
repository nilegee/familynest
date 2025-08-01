import { main } from "./main.js";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = window.SUPABASE_URL;
const supabaseKey = window.SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

const allowed = {
  'abdessamia.mariem@gmail.com': 'Mariem',
  'nilezat@gmail.com': 'Ghassan',
  'yazidgeemail@gmail.com': 'Yazid',
  'yahyageemail@gmail.com': 'Yahya'
};

export function initAuth(onSignedIn) {
  const signInBtn = document.getElementById('signInBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const authContainer = document.getElementById('authContainer');

  signInBtn?.addEventListener('click', () => {
    supabase.auth.signInWithOAuth({ provider: 'google' });
  });

  signOutBtn?.addEventListener('click', () => supabase.auth.signOut());

  supabase.auth.onAuthStateChange(async (_event, session) => {
    const user = session?.user || null;
    if (user && allowed[user.email]) {
      localStorage.setItem('familyCurrentUser', allowed[user.email]);
      document.body.dataset.user = user.email;
      authContainer.hidden = true;
      signOutBtn.hidden = false;
      if (typeof onSignedIn === 'function') onSignedIn();
    } else {
      if (user && !allowed[user.email]) {
        alert('This email is not allowed.');
        await supabase.auth.signOut();
      }
      localStorage.removeItem('familyCurrentUser');
      document.body.dataset.user = '';
      authContainer.hidden = false;
      signOutBtn.hidden = true;
    }
  });
}
initAuth(main);
