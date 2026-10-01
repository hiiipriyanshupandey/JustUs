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
   CONSTANTS
========================= */

const MEDIA_BUCKET =
  "justus-media";

const MAX_FILE_SIZE =
  50 * 1024 * 1024;


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
        "id, sender_id, receiver_id, message, message_type, media_url, media_name, media_type, created_at"
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


  /*
    Create signed URLs for private
    media files.
  */

  const messages =
    await Promise.all(
      data.map(
        async function(item) {

          if (
            item.message_type ===
              "image" ||
            item.message_type ===
              "video"
          ) {

            if (
              item.media_url
            ) {

              const {
                data:
                  signedData,
                error:
                  signedError
              } =
                await supabaseClient
                  .storage
                  .from(
                    MEDIA_BUCKET
                  )
                  .createSignedUrl(
                    item.media_url,
                    3600
                  );

              if (
                signedError
              ) {

                console.error(
                  "Signed URL error:",
                  signedError
                );

              }

              return {
                ...item,
                signedUrl:
                  signedData
                    ?.signedUrl ||
                  null
              };

            }

          }

          return item;

        }
      )
    );


  let html = "";


  messages.forEach(
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


      /*
        IMAGE
      */

      if (
        item.message_type ===
          "image"
      ) {

        html += createImageMessage(
          item,
          mine,
          time
        );

        return;
      }


      /*
        VIDEO
      */

      if (
        item.message_type ===
          "video"
      ) {

        html += createVideoMessage(
          item,
          mine,
          time
        );

        return;
      }


      /*
        NORMAL TEXT
      */

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
                item.message || ""
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
   IMAGE MESSAGE
========================= */

function createImageMessage(
  item,
  mine,
  time
) {

  const bubbleClass =
    mine
      ? "sent"
      : "received";


  if (
    !item.signedUrl
  ) {

    return `

      <div
        class="message-row ${
          mine
            ? "sent"
            : "received"
        }"
      >

        <div
          class="message-bubble ${
            bubbleClass
          }"
        >

          <div class="message-text">
            Image unavailable
          </div>

          <div class="message-time">
            ${time}
          </div>

        </div>

      </div>

    `;

  }


  return `

    <div
      class="message-row ${
        mine
          ? "sent"
          : "received"
      }"
    >

      <div
        class="message-bubble ${
          bubbleClass
        }"
      >

        <img
          src="${escapeHtml(
            item.signedUrl
          )}"
          class="media-preview message-image"
          alt="Photo"
          loading="lazy"
        >

        <div
          class="media-file-name"
        >
          ${escapeHtml(
            item.media_name ||
            "Photo"
          )}
        </div>

        <div
          class="media-actions"
        >

          <a
            href="${escapeHtml(
              item.signedUrl
            )}"
            target="_blank"
            rel="noopener"
          >
            Open
          </a>

          <a
            href="${escapeHtml(
              item.signedUrl
            )}"
            target="_blank"
            rel="noopener"
            download
          >
            Download
          </a>

        </div>

        <div class="message-time">
          ${time}
        </div>

      </div>

    </div>

  `;

}


/* =========================
   VIDEO MESSAGE
========================= */

function createVideoMessage(
  item,
  mine,
  time
) {

  const bubbleClass =
    mine
      ? "sent"
      : "received";


  if (
    !item.signedUrl
  ) {

    return `

      <div
        class="message-row ${
          mine
            ? "sent"
            : "received"
        }"
      >

        <div
          class="message-bubble ${
            bubbleClass
          }"
        >

          <div class="message-text">
            Video unavailable
          </div>

          <div class="message-time">
            ${time}
          </div>

        </div>

      </div>

    `;

  }


  return `

    <div
      class="message-row ${
        mine
          ? "sent"
          : "received"
      }"
    >

      <div
        class="message-bubble ${
          bubbleClass
        }"
      >

        <video
          class="media-preview message-video"
          controls
          playsinline
          preload="metadata"
        >

          <source
            src="${escapeHtml(
              item.signedUrl
            )}"
            type="${escapeHtml(
              item.media_type ||
              "video/mp4"
            )}"
          >

        </video>

        <div
          class="media-file-name"
        >
          ${escapeHtml(
            item.media_name ||
            "Video"
          )}
        </div>

        <div
          class="media-actions"
        >

          <a
            href="${escapeHtml(
              item.signedUrl
            )}"
            target="_blank"
            rel="noopener"
          >
            Open
          </a>

          <a
            href="${escapeHtml(
              item.signedUrl
            )}"
            target="_blank"
            rel="noopener"
            download
          >
            Download
          </a>

        </div>

        <div class="message-time">
          ${time}
        </div>

      </div>

    </div>

  `;

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
   SEND TEXT MESSAGE
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
          message,

        message_type:
          "text",

        media_url:
          null,

        media_name:
          null,

        media_type:
          null

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
   MEDIA PICKER
========================= */

function setupMediaPicker() {

  const mediaInput =
    document.getElementById(
      "mediaInput"
    );

  if (!mediaInput) {
    return;
  }


  mediaInput.onchange =
    async function() {

      const file =
        mediaInput.files[0];

      if (!file) {
        return;
      }


      /*
        Reset picker after we have
        captured the File object.
      */

      mediaInput.value = "";


      await uploadMedia(
        file
      );

    };

}


/* =========================
   UPLOAD MEDIA
========================= */

async function uploadMedia(
  file
) {

  if (
    !currentUser ||
    !friend
  ) {
    return;
  }


  /* =========================
     VALIDATE TYPE
  ========================== */

  const isImage =
    file.type.startsWith(
      "image/"
    );

  const isVideo =
    file.type.startsWith(
      "video/"
    );


  if (
    !isImage &&
    !isVideo
  ) {

    alert(
      "Please select an image or video."
    );

    return;
  }


  /* =========================
     VALIDATE SIZE
  ========================== */

  if (
    file.size >
    MAX_FILE_SIZE
  ) {

    alert(
      "File is larger than 50 MB."
    );

    return;
  }


  const mediaType =
    isImage
      ? "image"
      : "video";


  /* =========================
     FILE NAME
  ========================== */

  const originalName =
    file.name
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );


  const uniqueName =
    Date.now() +
    "_" +
    crypto.randomUUID() +
    "_" +
    originalName;


  /* =========================
     PRIVATE PATH
  ========================== */

  const ids = [
    currentUser.id,
    friend.id
  ].sort();


  const filePath =
    ids[0] +
    "/" +
    ids[1] +
    "/" +
    uniqueName;


  console.log(
    "Uploading media:",
    filePath
  );


  setMediaLoading(
    true
  );


  try {

    /* =========================
       UPLOAD TO STORAGE
    ========================== */

    const {
      data:
        uploadData,
      error:
        uploadError
    } =
      await supabaseClient
        .storage
        .from(
          MEDIA_BUCKET
        )
        .upload(
          filePath,
          file,
          {
            cacheControl:
              "3600",

            contentType:
              file.type,

            upsert:
              false
          }
        );


    if (
      uploadError
    ) {

      console.error(
        "Storage upload error:",
        uploadError
      );

      alert(
        "Upload failed: " +
        uploadError.message
      );

      return;
    }


    console.log(
      "Upload successful:",
      uploadData
    );


    /* =========================
       SAVE MESSAGE
    ========================== */

    const {
      error:
        messageError
    } =
      await supabaseClient
        .from("messages")
        .insert({

          sender_id:
            currentUser.id,

          receiver_id:
            friend.id,

          message:
            null,

          message_type:
            mediaType,

          media_url:
            filePath,

          media_name:
            file.name,

          media_type:
            file.type

        });


    if (
      messageError
    ) {

      console.error(
        "Media message error:",
        messageError
      );


      /*
        Remove orphaned storage
        file if DB insert fails.
      */

      await supabaseClient
        .storage
        .from(
          MEDIA_BUCKET
        )
        .remove([
          filePath
        ]);


      alert(
        "Media message could not be saved."
      );

      return;
    }


    console.log(
      "Media message saved."
    );


  } catch (error) {

    console.error(
      "Media upload exception:",
      error
    );

    alert(
      "Something went wrong while uploading."
    );

  } finally {

    setMediaLoading(
      false
    );

  }

}


/* =========================
   MEDIA LOADING UI
========================= */

function setMediaLoading(
  loading
) {

  const button =
    document.getElementById(
      "mediaButton"
    );

  if (!button) {
    return;
  }


  if (loading) {

    button.disabled =
      true;

    button.textContent =
      "…";

  } else {

    button.disabled =
      false;

    button.textContent =
      "＋";

  }

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
            key:
              currentUser.id
          }

        }
      }
    );


  /* =========================
     REALTIME MESSAGES
  ========================== */

  chatChannel.on(
    "postgres_changes",
    {
      event:
        "INSERT",

      schema:
        "public",

      table:
        "messages"
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
     TYPING
  ========================== */

  chatChannel.on(
    "broadcast",
    {
      event:
        "typing"
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


      if (
        friendTyping
      ) {

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
      event:
        "sync"
    },
    function() {

      console.log(
        "Presence sync:",
        chatChannel
          .presenceState()
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
      event:
        "join"
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
      event:
        "leave"
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


        if (
          statusElement
        ) {

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


        if (
          statusElement
        ) {

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


  if (
    friendTyping
  ) {

    showTyping();

    return;
  }


  const state =
    chatChannel
      .presenceState();


  const friendPresence =
    state[
      friend.id
    ];


  const friendOnline =
    Array.isArray(
      friendPresence
    ) &&
    friendPresence.length >
      0;


  if (
    friendOnline
  ) {

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


  if (
    !myTyping
  ) {

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
        event.key ===
          "Enter" &&
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
   OLD MEDIA MESSAGE
========================= */

function showMediaMessage() {

  openMediaPicker();

}


/* =========================
   OPEN MEDIA PICKER
========================= */

function setupMediaPicker() {

  const mediaInput =
    document.getElementById("mediaInput");

  if (!mediaInput) return;

  mediaInput.onchange = function () {

    const file = mediaInput.files[0];

    mediaInput.value = "";

    if (!file) return;

    const isImage =
      file.type.startsWith("image/");

    const isVideo =
      file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      alert("Please select an image or video.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("File is larger than 50 MB.");
      return;
    }

    showMediaPreview(file);
  };
}


function showMediaPreview(file) {

  const old =
    document.getElementById("mediaPreviewOverlay");

  if (old) old.remove();

  const url =
    URL.createObjectURL(file);

  const isVideo =
    file.type.startsWith("video/");

  const overlay =
    document.createElement("div");

  overlay.id =
    "mediaPreviewOverlay";

  overlay.style.cssText = `
    position:fixed;
    inset:0;
    z-index:99999;
    background:rgba(0,0,0,.88);
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
  `;

  const card =
    document.createElement("div");

  card.style.cssText = `
    width:100%;
    max-width:420px;
    background:#19181f;
    border-radius:20px;
    overflow:hidden;
  `;

  const media =
    isVideo
      ? document.createElement("video")
      : document.createElement("img");

  media.src = url;

  media.style.cssText = `
    width:100%;
    max-height:65vh;
    display:block;
    object-fit:contain;
    background:#000;
  `;

  if (isVideo) {
    media.controls = true;
    media.playsInline = true;
  }

  const bottom =
    document.createElement("div");

  bottom.style.cssText = `
    display:flex;
    align-items:center;
    gap:10px;
    padding:14px;
  `;

  const cancel =
    document.createElement("button");

  cancel.textContent = "✕";

  cancel.style.cssText = `
    width:44px;
    height:44px;
    border:0;
    border-radius:50%;
    background:#292830;
    color:white;
    font-size:20px;
  `;

  const send =
    document.createElement("button");

  send.textContent = "➤ Send";

  send.style.cssText = `
    margin-left:auto;
    border:0;
    border-radius:12px;
    padding:12px 18px;
    background:white;
    color:#111;
    font-weight:700;
    font-size:15px;
  `;

  cancel.onclick = function () {

    URL.revokeObjectURL(url);

    overlay.remove();
  };

  send.onclick = async function () {

    send.disabled = true;
    send.textContent = "Sending...";

    await uploadMedia(file);

    URL.revokeObjectURL(url);

    overlay.remove();
  };

  bottom.appendChild(cancel);
  bottom.appendChild(send);

  card.appendChild(media);
  card.appendChild(bottom);

  overlay.appendChild(card);

  document.body.appendChild(overlay);
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

    if (
      chatChannel
    ) {

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
