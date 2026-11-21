/* Password recovery uses Supabase's authenticated recovery session.
   No password or recovery token is copied into workout storage or backups. */
window.RoundworkAuthRecovery=(()=>{
  'use strict';
  const MARKER='roundwork.password-recovery.v1';
  const pairs=[
    ['Forgot password or need account access?','¿Olvidaste la contraseña o necesitas recuperar el acceso?'],
    ['Recover account access','Recuperar acceso a la cuenta'],
    ['Send recovery email','Enviar correo de recuperación'],
    ['Back to sign in','Volver al inicio de sesión'],
    ['Enter the email used for your ROUNDWORK account. Open the recovery link from the email to choose a new password.','Introduce el correo de tu cuenta de ROUNDWORK. Abre el enlace del correo de recuperación para elegir una contraseña nueva.'],
    ['If an account exists for this address and delivery is available, a recovery email will arrive. Check spam and use the most recent link.','Si existe una cuenta con esta dirección y el envío está disponible, recibirás un correo de recuperación. Revisa el spam y usa el enlace más reciente.'],
    ['Recovery email could not be sent. Check your connection and try again.','No se pudo enviar el correo de recuperación. Revisa tu conexión e inténtalo de nuevo.'],
    ['Sending recovery email','Enviando correo de recuperación'],
    ['Choose a new password','Elige una contraseña nueva'],
    ['New password','Contraseña nueva'],
    ['Confirm new password','Confirma la contraseña nueva'],
    ['Save new password','Guardar contraseña nueva'],
    ['Cancel recovery','Cancelar recuperación'],
    ['Use at least 8 characters. Enter the same password in both fields.','Usa al menos 8 caracteres. Introduce la misma contraseña en ambos campos.'],
    ['The passwords do not match.','Las contraseñas no coinciden.'],
    ['Saving new password','Guardando contraseña nueva'],
    ['Password updated. You can sign in on your other devices with the new password.','Contraseña actualizada. Puedes iniciar sesión en tus otros dispositivos con la contraseña nueva.'],
    ['Password could not be updated. Check your connection and try again.','No se pudo actualizar la contraseña. Revisa tu conexión e inténtalo de nuevo.'],
    ['Choose a password different from your current password.','Elige una contraseña distinta a la actual.'],
    ['The password does not meet the account security requirements. Choose a stronger password.','La contraseña no cumple los requisitos de seguridad de la cuenta. Elige una contraseña más segura.'],
    ['This recovery link is invalid or has expired. Request a new email and open its latest link.','Este enlace de recuperación no es válido o ha caducado. Solicita otro correo y abre el enlace más reciente.'],
    ['Checking recovery link','Verificando enlace de recuperación'],
    ['Workout sync is paused while you choose a new password. Your local workouts stay on this device.','La sincronización está pausada mientras eliges una contraseña nueva. Tus entrenamientos locales permanecen en este dispositivo.'],
    ['Cannot access your email?','¿No puedes acceder a tu correo?'],
    ['Recover your email account with its provider first. Account access requires verification of the account email.','Primero recupera tu correo con su proveedor. El acceso a la cuenta requiere verificar el correo de la cuenta.'],
    ['Recover Gmail access','Recuperar acceso a Gmail'],
    ['If another trusted device is still signed in, export your workout backup there before signing out. A new account does not automatically receive the old account’s cloud history.','Si otro dispositivo de confianza sigue conectado, exporta allí una copia de tus entrenamientos antes de cerrar sesión. Una cuenta nueva no recibe automáticamente el historial en la nube de la cuenta anterior.'],
    ['You can also use the sign-in email option without remembering your password.','También puedes usar el correo de acceso sin recordar tu contraseña.']
  ];
  for(const [en,es] of pairs)window.ROUNDWORK_ES[en]=es;
  function create({client,dialog,changed,pause,resume}){
    const $=s=>document.querySelector(s),t=s=>window.RoundworkI18n?.translate(s)||s;
    let mode='idle',owner=null,pending=false,busy=false,message='',messageError=false;
    const url=new URL(location.href),fragment=new URLSearchParams(url.hash.slice(1));
    try{const saved=JSON.parse(sessionStorage.getItem(MARKER)||'null');if(typeof saved?.owner==='string'&&saved.owner.length<=128)owner=saved.owner;}catch{}
    if(owner){mode='checking';pending=true;}
    if(fragment.get('type')==='recovery'){mode='checking';pending=true;}
    if(fragment.has('error')||fragment.has('error_code')){owner=null;pending=false;mode='request';message='This recovery link is invalid or has expired. Request a new email and open its latest link.';messageError=true;}
    const section=document.createElement('section');section.id='auth-recovery';
    section.innerHTML='<section id="auth-recovery-request" hidden aria-labelledby="auth-recovery-title"><h3 id="auth-recovery-title">Recover account access</h3><p>Enter the email used for your ROUNDWORK account. Open the recovery link from the email to choose a new password.</p><form id="auth-recovery-email-form"><label for="auth-recovery-email">Email address</label><input id="auth-recovery-email" type="email" autocomplete="email" inputmode="email" maxlength="254" required><div class="sync-actions"><button class="button button-dark" type="submit" id="auth-recovery-send">Send recovery email</button><button class="text-button" type="button" id="auth-recovery-back">Back to sign in</button></div></form><p>You can also use the sign-in email option without remembering your password.</p></section><section id="auth-recovery-reset" hidden aria-labelledby="auth-reset-title"><h3 id="auth-reset-title">Choose a new password</h3><p>Workout sync is paused while you choose a new password. Your local workouts stay on this device.</p><form id="auth-recovery-reset-form"><label for="auth-new-password">New password</label><input id="auth-new-password" type="password" autocomplete="new-password" minlength="8" maxlength="256" aria-describedby="auth-reset-help" required><label for="auth-confirm-password">Confirm new password</label><input id="auth-confirm-password" type="password" autocomplete="new-password" minlength="8" maxlength="256" aria-describedby="auth-reset-help" required><p id="auth-reset-help">Use at least 8 characters. Enter the same password in both fields.</p><div class="sync-actions"><button class="button button-dark" type="submit" id="auth-recovery-save">Save new password</button><button class="text-button" type="button" id="auth-recovery-cancel">Cancel recovery</button></div></form></section><p id="auth-recovery-message" role="status" aria-live="polite"></p>';
    $('#sync-dialog .modal-content').insertBefore(section,$('#sync-signin'));
    const forgot=document.createElement('button');forgot.id='auth-forgot';forgot.type='button';forgot.className='text-button auth-recovery-link';forgot.textContent='Forgot password or need account access?';$('#sync-password-form').insertBefore(forgot,$('#sync-password-help'));
    const help=document.createElement('details');help.className='auth-recovery-help';help.innerHTML='<summary>Cannot access your email?</summary><p>Recover your email account with its provider first. Account access requires verification of the account email.</p><p><a href="https://accounts.google.com/signin/recovery" target="_blank" rel="noopener noreferrer">Recover Gmail access</a></p><p>If another trusted device is still signed in, export your workout backup there before signing out. A new account does not automatically receive the old account’s cloud history.</p>';
    // This help stays available in both normal sign-in and recovery views.
    $('#sync-dialog .modal-content').appendChild(help);
    function marker(value){try{if(value)sessionStorage.setItem(MARKER,JSON.stringify({owner:value}));else sessionStorage.removeItem(MARKER);}catch{}}
    function clearPasswords(){for(const id of ['auth-new-password','auth-confirm-password','sync-password'])$('#'+id).value='';}
    function say(text,error=false){message=text;messageError=error;paint();}
    function paint(){
      $('#auth-recovery-request').hidden=mode!=='request';$('#auth-recovery-reset').hidden=mode!=='reset';
      $('#auth-recovery-message').textContent=t(mode==='checking'?'Checking recovery link':message);
      $('#auth-recovery-message').classList.toggle('sync-error',messageError);
      for(const id of ['auth-recovery-send','auth-recovery-save','auth-recovery-back','auth-recovery-cancel'])$('#'+id).disabled=busy;
    }
    function open(){if(!dialog.open)dialog.showModal();}
    function notify(){paint();changed();if(mode!=='idle')open();}
    function invalidLink(){owner=null;pending=false;marker(null);clearPasswords();mode='request';say('This recovery link is invalid or has expired. Request a new email and open its latest link.',true);pause();notify();}
    forgot.onclick=()=>{if(busy)return;mode='request';$('#auth-recovery-email').value=$('#sync-email').value.trim();say('');notify();$('#auth-recovery-email').focus();};
    $('#auth-recovery-back').onclick=()=>{if(busy)return;mode='idle';say('');notify();forgot.focus();};
    $('#auth-recovery-email-form').onsubmit=async event=>{
      event.preventDefault();if(busy||!$('#auth-recovery-email').reportValidity())return;busy=true;say('Sending recovery email');
      try{
        const {error}=await client.auth.resetPasswordForEmail($('#auth-recovery-email').value.trim(),{redirectTo:new URL('./',location.href).href});
        if(error){say(error.code==='email_address_not_authorized'?'The app’s email service cannot deliver to this address. Contact the app owner to enable it.':error.status===429?'Too many sign-in attempts. Wait and try again.':'Recovery email could not be sent. Check your connection and try again.',true);return;}
        say('If an account exists for this address and delivery is available, a recovery email will arrive. Check spam and use the most recent link.');
      }catch{say('Recovery email could not be sent. Check your connection and try again.',true);}
      finally{busy=false;paint();}
    };
    $('#auth-recovery-reset-form').onsubmit=async event=>{
      event.preventDefault();if(busy||mode!=='reset'||!owner||!$('#auth-recovery-reset-form').reportValidity())return;
      const password=$('#auth-new-password').value;
      if(password.length<8){say('Use at least 8 characters for a new password.',true);return;}
      if(password!==$('#auth-confirm-password').value){say('The passwords do not match.',true);return;}
      const recoveryOwner=owner;busy=true;say('Saving new password');
      try{
        const {data,error}=await client.auth.updateUser({password});
        if(error){if([401,403].includes(error.status)||['session_not_found','refresh_token_not_found'].includes(error.code)){invalidLink();return;}say(error.code==='same_password'?'Choose a password different from your current password.':error.code==='weak_password'?'The password does not meet the account security requirements. Choose a stronger password.':'Password could not be updated. Check your connection and try again.',true);return;}
        if(!data?.user||data.user.id!==recoveryOwner){invalidLink();return;}
        clearPasswords();marker(null);pending=false;owner=null;mode='idle';say('');resume(data.user);notify();
        $('#sync-auth-message').textContent=t('Password updated. You can sign in on your other devices with the new password.');
      }catch{say('Password could not be updated. Check your connection and try again.',true);}
      finally{busy=false;paint();}
    };
    $('#auth-recovery-cancel').onclick=async()=>{
      if(busy)return;busy=true;paint();
      try{const {error}=await client.auth.signOut({scope:'local'});if(error){say('Sync could not finish.',true);return;}clearPasswords();marker(null);owner=null;pending=false;mode='idle';say('');resume(null);notify();}
      catch{say('Sync could not finish.',true);}finally{busy=false;paint();}
    };
    function handleAuth(event,session){
      if(event==='PASSWORD_RECOVERY'&&session?.user){owner=session.user.id;pending=true;marker(owner);mode='reset';say('');clearPasswords();pause();notify();return true;}
      if(!pending)return false;
      if(event==='SIGNED_OUT'){invalidLink();return false;}
      if(session?.user&&owner===session.user.id){mode='reset';pause();notify();return true;}
      // A fragment alone is not treated as an authenticated recovery session.
      if(event==='INITIAL_SESSION'){invalidLink();return true;}
      return true;
    }
    document.addEventListener('roundwork-language',paint);paint();if(mode!=='idle')open();
    return {active:()=>mode!=='idle',handleAuth,initialError:()=>{if(pending){invalidLink();return true;}return false;}};
  }
  return {create,text:pairs.map(pair=>pair[0])};
})();

