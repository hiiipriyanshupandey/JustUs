const SUPABASE_URL =
  "https://rfcvoeeydeamyytzfxbd.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_EB3sMbpOK9EIIUtgl4eQHQ_Vr-Tvs8b";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


let currentUser = null;
let friendId = null;
let friendUsername = "";


// Get friend ID from URL
const params = new URLSearchParams(
  window.location.search
);

friendId = params.get("friend");


// DOM
const messagesBox =
  document.getElementById("messages");

const messageInput =
  document.getElementById("messageInput");


// Start
async function startChat() {

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();


  if (!session) {

    window.location.href = "index.html";

    return;
  }


  currentUser = session.user;


  if (!friendId) {

    alert("Friend not found.");

    window.location.href = "index.html";

    return;
  }


  await loadFriend();

  await loadMessages();

}


// Load friend profile
async function loadFriend() {

  const {
    data,
    error
  } = await supabaseClient
    .from("profiles")
    .select("id, username")
    .eq("id", friendId)
    .single();


  if (error) {

    console.error(error);

    return;
  }


  friendUsername = data.username;


  const nameElement =
    document.getElementById("friendName");

  if (nameElement) {

    nameElement.textContent =
      "@" + data.username;

  }


  const statusElement =
    document.getElementById("friendStatus");

  if (statusElement) {

    statusElement.textContent =
      "Offline";

  }

}


// Load messages
async function loadMessages() {

  const {
    data,
    error
  } = await supabaseClient
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${currentUser.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUser.id})`
    )
    .order(
      "created_at",
      {
        ascending: true
      }
    );


  if (error) {

    console.error(error);

    return;
  }


  messagesBox.innerHTML = "";


  if (!data || data.length === 0) {

    showEmptyChat();

    return;
  }


  data.forEach(
    message => renderMessage(message)
  );


  scrollToBottom();

}


// Empty chat
function showEmptyChat() {

  messagesBox.innerHTML = `
    <div class="chat-empty">
      <div class="chat-empty-icon">💬</div>
      <div>No messages yet.</div>
      <small>Start the conversation.</small>
    </div>
  `;

}


// Render message
function renderMessage(message) {

  const isMine =
    message.sender_id === currentUser.id;


  const bubble =
    document.createElement("div");


  bubble.className =
    isMine
      ? "message mine"
      : "message theirs";


  bubble.innerHTML =
    escapeHtml(message.message);


  messagesBox.appendChild(bubble);

}


// Send message
async function sendMessage() {

  const text =
    messageInput.value.trim();


  if (!text) return;


  if (!currentUser || !friendId) return;


  const {
    error
  } = await supabaseClient
    .from("messages")
    .insert({

      sender_id:
        currentUser.id,

      receiver_id:
        friendId,

      message:
        text

    });


  if (error) {

    console.error(error);

    alert(
      "Message send nahi hua."
    );

    return;
  }


  messageInput.value = "";


  await loadMessages();

}


// Enter to send
if (messageInput) {

  messageInput.addEventListener(
    "keydown",
    function(event) {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();

      }

    }
  );

}


// Back
function goBack() {

  window.location.href =
    "index.html";

}


// Escape HTML
function escapeHtml(text) {

  const div =
    document.createElement("div");

  div.textContent =
    text;

  return div.innerHTML;

}


// Scroll
function scrollToBottom() {

  messagesBox.scrollTop =
    messagesBox.scrollHeight;

}


// Start app
startChat();
