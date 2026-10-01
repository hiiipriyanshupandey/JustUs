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

let myTyping = false;
let friendTyping = false;

let typingTimeout = null;
let friendTypingTimeout = null;


/* =========================
   FRIEND ID
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

    console.error(
      "Auth error:",
      error
    );

    return false;
  }

  if (!data.session) {

    window.location.href =
      "index.html";

    return false;
  }

  currentUser =
    data.session.user;

  console.log(
    "Current user:",
    currentUser.id
  );

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

    return false;
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

    console.error(
      "Friend error:",
      error
    );

    showError(
      error.message
    );

    return false;
  }

  if (!data) {

    showError(
      "Friend not found."
    );

    return false;
  }

  friend = data;

  document.getElementById(
    "friendName"
  ).textContent =
    "@" + friend.username;

  document.getElementById(
    "friendStatus"
  ).textContent =
    "Connecting...";

  document.getElementById(
    "emptyText"
  ).textContent =
    "Say hello to @" +
    friend.username +
    " 👋";

  await loadMessages();

  return true;
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

    console.error(
      "Messages error:",
      error
    );

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

    console.error(
      "Send message error:",
      error
    );

    showError(
      error.message
    );

    return;
  }

  input.value = "";

  input.focus();
}


/* =========================
   CHAT CHANNEL
========================= */

function createChatChannel() {

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

  const channelName =
    "justus-chat-" +
    ids[0] +
    "-" +
    ids[1];

  console.log(
    "Creating channel:",
    channelName
  );

  chatChannel =
    supabaseClient.channel(
      channelName,
      {
        config: {
          presence: {
            key: currentUser.id
          }
        }
      }
    );


  /* =========================
     DATABASE MESSAGES
  ========================== */

  chatChannel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages"
    },
    function(payload) {

      console.log(
        "Realtime message:",
        payload
      );

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
  );


  /* =========================
     BROADCAST TYPING
  ========================== */

  chatChannel.on(
    "broadcast",
    {
      event: "typing"
    },
    function(event) {

      console.log(
        "Typing event:",
        event
      );

      const data =
        event.payload;

      if (
        !data ||
        data.user_id !==
          friend.id
      ) {
        return;
      }

      friendTyping =
        data.typing === true;

      clearTimeout(
        friendTypingTimeout
      );

      if (friendTyping) {

        showTyping();

        friendTypingTimeout =
          setTimeout(
            function() {

              friendTyping =
                false;

              updateFriendStatus();

            },
            2500
          );

      } else {

        updateFriendStatus();

      }

    }
  );


  /* =========================
     PRESENCE SYNC
  ========================== */

  chatChannel.on(
    "presence",
    {
      event: "sync"
    },
    function() {

      console.log(
        "Presence sync:",
        chatChannel.presenceState()
      );

      updateFriendStatus();

    }
  );


  /* =========================
     PRESENCE JOIN
  ========================== */

  chatChannel.on(
    "presence",
    {
      event: "join"
    },
    function(event) {

      console.log(
        "Presence join:",
        event
      );

      updateFriendStatus();

    }
  );


  /* =========================
     PRESENCE LEAVE
  ========================== */

  chatChannel.on(
    "presence",
    {
      event: "leave"
    },
    function(event) {

      console.log(
        "Presence leave:",
        event
      );

      updateFriendStatus();

    }
  );


  /* =========================
     SUBSCRIBE
  ========================== */

  chatChannel.subscribe(
    async function(status) {

      console.log(
        "JustUs Realtime status:",
        status
      );

      const statusElement =
        document.getElementById(
          "friendStatus"
        );

      if (
        status ===
        "SUBSCRIBED"
      ) {

        console.log(
          "Realtime channel connected."
        );

        const trackResult =
          await chatChannel.track({

            user_id:
              currentUser.id,

            username:
              currentUser
                .user_metadata
                ?.username || "",

            online_at:
              new Date()
                .toISOString()

          });

        console.log(
          "Presence track result:",
          trackResult
        );

        updateFriendStatus();

        return;
      }


      if (
        status ===
        "CHANNEL_ERROR"
      ) {

        console.error(
          "Realtime CHANNEL_ERROR"
        );

        if (statusElement) {

          statusElement.textContent =
            "Connection error";

          statusElement.style.color =
            "#ff6b6b";

        }

        return;
      }


      if (
        status ===
        "TIMED_OUT"
      ) {

        console.error(
          "Realtime TIMED_OUT"
        );

        if (statusElement) {

          statusElement.textContent =
            "Connection timeout";

          statusElement.style.color =
            "#ff6b6b";

        }

        return;
      }


      if (
        status ===
        "CLOSED"
      ) {

        console.warn(
          "Realtime channel closed."
        );

      }

    }
  );
}


/* =========================
   FRIEND STATUS
========================= */

function updateFriendStatus() {

  if (
    !chatChannel ||
    !friend
  ) {
    return;
  }

  const status =
    document.getElementById(
      "friendStatus"
    );

  if (!status) {
    return;
  }


  /* FRIEND TYPING */

  if (friendTyping) {

    showTyping();

    return;
  }


  /* PRESENCE */

  const state =
    chatChannel.presenceState();

  const friendPresence =
    state[friend.id];

  const friendOnline =
    Array.isArray(
      friendPresence
    ) &&
    friendPresence.length > 0;


  if (friendOnline) {

    status.textContent =
      "Online";

    status.style.color =
      "#7cff9b";

  } else {

    status.textContent =
      "Offline";

    status.style.color =
      "#777";

  }

}


/* =========================
   START TYPING
========================= */

function startTyping() {

  if (
    !chatChannel ||
    !currentUser ||
    !friend
  ) {
    return;
  }

  if (!myTyping) {

    myTyping =
      true;

    console.log(
      "Sending typing: true"
    );

    chatChannel.send({

      type:
        "broadcast",

      event:
        "typing",

      payload: {

        user_id:
          currentUser.id,

        typing:
          true

      }

    })
    .then(
      function(result) {

        console.log(
          "Typing broadcast result:",
          result
        );

      }
    );

  }


  clearTimeout(
    typingTimeout
  );

  typingTimeout =
    setTimeout(
      stopTyping,
      1500
    );
}


/* =========================
   STOP TYPING
========================= */

function stopTyping() {

  if (
    !chatChannel ||
    !currentUser ||
    !myTyping
  ) {
    return;
  }

  myTyping =
    false;

  clearTimeout(
    typingTimeout
  );

  console.log(
    "Sending typing: false"
  );

  chatChannel.send({

    type:
      "broadcast",

    event:
      "typing",

    payload: {

      user_id:
        currentUser.id,

      typing:
        false

    }

  })
  .then(
    function(result) {

      console.log(
        "Stop typing result:",
        result
      );

    }
  );
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


/* =========================
   INPUT
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

function showError(
  message
) {

  const container =
    document.getElementById(
      "messages"
    );

  if (!container) {
    return;
  }

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
   MEDIA
========================= */

function showMediaMessage() {

  alert(
    "Photo & video sharing will be added next."
  );
}


/* =========================
   REACTIONS
========================= */

function showReactionMessage() {

  alert(
    "Reactions will be added next."
  );
}


/* =========================
   MORE
========================= */

function showMoreOptions() {

  alert(
    "More chat options will be added later."
  );
}


/* =========================
   CLEANUP
========================= */

window.addEventListener(
  "beforeunload",
  function() {

    if (chatChannel) {

      chatChannel.untrack();

      supabaseClient
        .removeChannel(
          chatChannel
        );

    }

  }
);


/* =========================
   START
========================= */

async function startChat() {

  const loggedIn =
    await loadCurrentUser();

  if (!loggedIn) {
    return;
  }

  const friendLoaded =
    await loadFriend();

  if (!friendLoaded) {
    return;
  }

  setupInput();

  createChatChannel();
}


startChat();
