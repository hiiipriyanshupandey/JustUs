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
let friend = null;
let chatChannel = null;

let typingTimer = null;
let isTyping = false;


/* =========================
   GET FRIEND ID
========================= */

function getFriendId() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  return params.get("friend");
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   CURRENT USER
========================= */

async function loadCurrentUser() {

  const {
    data,
    error
  } =
    await supabaseClient.auth.getSession();


  if (error) {

    console.error(error);

    return false;
  }


  if (!data.session) {

    window.location.href =
      "index.html";

    return false;
  }


  currentUser =
    data.session.user;


  return true;
}


/* =========================
   LOAD FRIEND
========================= */

async function loadFriend() {

  const friendId =
    getFriendId();


  if (!friendId) {

    showError(
      "No friend selected."
    );

    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("id, username")
      .eq("id", friendId)
      .maybeSingle();


  if (error) {

    console.error(error);

    showError(
      error.message
    );

    return;
  }


  if (!data) {

    showError(
      "Friend not found."
    );

    return;
  }


  friend = data;


  document.getElementById(
    "friendName"
  ).textContent =
    "@" + friend.username;


  document.getElementById(
    "emptyText"
  ).textContent =
    "Say hello to @" +
    friend.username +
    " 👋";


  await loadMessages();
}


/* =========================
   LOAD MESSAGES
========================= */

async function loadMessages() {

  if (
    !currentUser ||
    !friend
  ) {
    return;
  }


  const container =
    document.getElementById(
      "messages"
    );


  const {
    data,
    error
  } =
    await supabaseClient
      .from("messages")
      .select(
        "id, sender_id, receiver_id, message, created_at"
      )
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${currentUser.id})`
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(error);

    showError(
      error.message
    );

    return;
  }


  if (
    !data ||
    data.length === 0
  ) {

    showEmptyChat();

    return;
  }


  let html = "";


  data.forEach(
    function(item) {

      const mine =
        item.sender_id ===
        currentUser.id;


      const time =
        new Date(
          item.created_at
        ).toLocaleTimeString(
          [],
          {
            hour: "numeric",
            minute: "2-digit"
          }
        );


      html += `

        <div
          class="message-row ${
            mine
              ? "sent"
              : "received"
          }"
        >

          <div
            class="message-bubble ${
              mine
                ? "sent"
                : "received"
            }"
          >

            <div class="message-text">
              ${escapeHtml(
                item.message
              )}
            </div>

            <div class="message-time">
              ${time}
            </div>

          </div>

        </div>

      `;
    }
  );


  container.innerHTML =
    html;


  scrollToBottom();
}


/* =========================
   EMPTY CHAT
========================= */

function showEmptyChat() {

  const container =
    document.getElementById(
      "messages"
    );


  const username =
    friend
      ? friend.username
      : "your friend";


  container.innerHTML = `

    <div
      id="emptyChat"
      class="empty-chat"
    >

      <div class="empty-avatar">
        👤
      </div>

      <div class="empty-title">
        Start your conversation
      </div>

      <div class="empty-text">
        Say hello to @${escapeHtml(
          username
        )} 👋
      </div>

    </div>

  `;
}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {

  if (
    !currentUser ||
    !friend
  ) {
    return;
  }


  const input =
    document.getElementById(
      "messageInput"
    );


  const button =
    document.getElementById(
      "sendButton"
    );


  const message =
    input.value.trim();


  if (!message) {
    return;
  }


  stopTyping();


  button.disabled =
    true;


  const {
    error
  } =
    await supabaseClient
      .from("messages")
      .insert({

        sender_id:
          currentUser.id,

        receiver_id:
          friend.id,

        message:
          message

      });


  button.disabled =
    false;


  if (error) {

    console.error(error);

    showError(
      error.message
    );

    return;
  }


  input.value = "";

  await loadMessages();

  input.focus();
}


/* =========================
   TYPING INDICATOR
========================= */

function startTyping() {

  if (
    !chatChannel ||
    !currentUser ||
    !friend
  ) {
    return;
  }


  if (!isTyping) {

    isTyping = true;


    chatChannel.send({

      type: "broadcast",

      event: "typing",

      payload: {
        user_id:
          currentUser.id,

        typing: true
      }

    });

  }


  clearTimeout(
    typingTimer
  );


  typingTimer =
    setTimeout(
      stopTyping,
      1500
    );
}


function stopTyping() {

  if (
    !chatChannel ||
    !currentUser ||
    !isTyping
  ) {
    return;
  }


  isTyping = false;


  clearTimeout(
    typingTimer
  );


  chatChannel.send({

    type: "broadcast",

    event: "typing",

    payload: {
      user_id:
        currentUser.id,

      typing: false
    }

  });

}


/* =========================
   SHOW TYPING
========================= */

function showTyping() {

  const status =
    document.getElementById(
      "friendStatus"
    );


  if (!status) {
    return;
  }


  status.textContent =
    "typing...";

  status.style.color =
    "#ffffff";
}


function hideTyping() {

  const status =
    document.getElementById(
      "friendStatus"
    );


  if (!status) {
    return;
  }


  status.textContent =
    "Offline";

  status.style.color =
    "#777";
}


/* =========================
   REALTIME CHAT
========================= */

function setupRealtime() {

  if (
    !currentUser ||
    !friend
  ) {
    return;
  }


  const ids = [
    currentUser.id,
    friend.id
  ].sort();


  chatChannel =
    supabaseClient.channel(
      "justus-chat-" +
      ids[0] +
      "-" +
      ids[1]
    );


  chatChannel
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages"
      },
      function(payload) {

        const message =
          payload.new;


        const belongsToChat =
          (
            message.sender_id ===
              currentUser.id &&
            message.receiver_id ===
              friend.id
          )
          ||
          (
            message.sender_id ===
              friend.id &&
            message.receiver_id ===
              currentUser.id
          );


        if (
          belongsToChat
        ) {

          loadMessages();

        }

      }
    )


    .on(
      "broadcast",
      {
        event: "typing"
      },
      function(payload) {

        const data =
          payload.payload;


        if (
          !data ||
          data.user_id !==
            friend.id
        ) {
          return;
        }


        if (data.typing) {

          showTyping();

        } else {

          hideTyping();

        }

      }
    )


    .subscribe(
      function(status) {

        console.log(
          "Realtime:",
          status
        );

      }
    );
}


/* =========================
   INPUT EVENTS
========================= */

function setupInput() {

  const input =
    document.getElementById(
      "messageInput"
    );


  if (!input) {
    return;
  }


  input.addEventListener(
    "input",
    function() {

      if (
        input.value.trim()
      ) {

        startTyping();

      } else {

        stopTyping();

      }

    }
  );


  input.addEventListener(
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


  input.addEventListener(
    "blur",
    function() {

      stopTyping();

    }
  );
}


/* =========================
   ERROR
========================= */

function showError(message) {

  const container =
    document.getElementById(
      "messages"
    );


  container.innerHTML = `

    <div class="error">
      ${escapeHtml(message)}
    </div>

  `;
}


/* =========================
   SCROLL
========================= */

function scrollToBottom() {

  const container =
    document.getElementById(
      "messages"
    );


  if (!container) {
    return;
  }


  container.scrollTop =
    container.scrollHeight;
}


/* =========================
   BACK
========================= */

function goBack() {

  window.location.href =
    "index.html";
}


/* =========================
   TEMP BUTTONS
========================= */

function showMediaMessage() {

  alert(
    "Photo & video sharing will be added next."
  );
}


function showReactionMessage() {

  alert(
    "Reactions will be added next."
  );
}


function showMoreOptions() {

  alert(
    "More chat options will be added later."
  );
}


/* =========================
   START
========================= */

async function startChat() {

  const loggedIn =
    await loadCurrentUser();


  if (!loggedIn) {
    return;
  }


  await loadFriend();


  setupInput();


  setupRealtime();
}


startChat();
