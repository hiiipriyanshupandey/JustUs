/* =========================
   JUSTUS — MAIN SCRIPT
========================= */


/* =========================
   SUPABASE
========================= */

const SUPABASE_URL =
  "https://rfcvoeeydeamyytzfxbd.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_EB3sMbpOK9EIIUtgl4eQHQ_Vr-Tvs8b";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =========================
   GLOBAL STATE
========================= */

let currentUser = null;

let selectedFriend = null;


/* =========================
   MESSAGE
========================= */

function showMessage(message) {

  const box =
    document.getElementById(
      "messageBox"
    );

  if (!box) return;

  box.textContent = message;

  box.classList.remove(
    "hidden"
  );

}


function clearMessage() {

  const box =
    document.getElementById(
      "messageBox"
    );

  if (!box) return;

  box.textContent = "";

  box.classList.add(
    "hidden"
  );

}


/* =========================
   AUTH SCREEN
========================= */

function showLogin() {

  document
    .getElementById("loginSection")
    .classList
    .remove("hidden");

  document
    .getElementById("signupSection")
    .classList
    .add("hidden");

  clearMessage();

}


function showSignup() {

  document
    .getElementById("loginSection")
    .classList
    .add("hidden");

  document
    .getElementById("signupSection")
    .classList
    .remove("hidden");

  clearMessage();

}


/* =========================
   LOGIN
========================= */

async function login() {

  clearMessage();

  const email =
    document
      .getElementById(
        "loginEmail"
      )
      .value
      .trim();

  const password =
    document
      .getElementById(
        "loginPassword"
      )
      .value;


  if (!email || !password) {

    showMessage(
      "Please enter email and password."
    );

    return;
  }


  const button =
    document.getElementById(
      "loginButton"
    );


  button.disabled = true;

  button.textContent =
    "Logging in...";


  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .signInWithPassword({

        email:
          email,

        password:
          password

      });


  button.disabled = false;

  button.textContent =
    "Login";


  if (error) {

    showMessage(
      error.message
    );

    return;
  }


  currentUser =
    data.user;


  await loadUser();

}


/* =========================
   SIGNUP
========================= */

async function signup() {

  clearMessage();

  const username =
    document
      .getElementById(
        "signupUsername"
      )
      .value
      .trim()
      .toLowerCase();

  const email =
    document
      .getElementById(
        "signupEmail"
      )
      .value
      .trim();

  const password =
    document
      .getElementById(
        "signupPassword"
      )
      .value;


  if (
    !username ||
    !email ||
    !password
  ) {

    showMessage(
      "Please fill all fields."
    );

    return;
  }


  if (username.length < 3) {

    showMessage(
      "Username must be at least 3 characters."
    );

    return;
  }


  if (
    !/^[a-z0-9_]+$/.test(
      username
    )
  ) {

    showMessage(
      "Username can contain only letters, numbers and underscore."
    );

    return;
  }


  if (password.length < 6) {

    showMessage(
      "Password must be at least 6 characters."
    );

    return;
  }


  const button =
    document.getElementById(
      "signupButton"
    );


  button.disabled = true;

  button.textContent =
    "Creating...";


  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .signUp({

        email:
          email,

        password:
          password,

        options: {

          data: {

            username:
              username

          }

        }

      });


  button.disabled = false;

  button.textContent =
    "Create Account";


  if (error) {

    showMessage(
      error.message
    );

    return;
  }


  if (!data.session) {

    showMessage(
      "Account created. Check your email to confirm your account."
    );

    return;
  }


  currentUser =
    data.user;


  await loadUser();

}


/* =========================
   FORGOT PASSWORD
========================= */

async function forgotPassword() {

  clearMessage();

  const email =
    document
      .getElementById(
        "loginEmail"
      )
      .value
      .trim();


  if (!email) {

    showMessage(
      "Enter your email first."
    );

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .auth
      .resetPasswordForEmail(
        email,
        {
          redirectTo:
            "https://hiiipriyanshupandey.github.io/JustUs/"
        }
      );


  if (error) {

    showMessage(
      error.message
    );

    return;
  }


  showMessage(
    "Password reset email sent."
  );

}


/* =========================
   LOAD USER
========================= */

async function loadUser() {

  const {
    data
  } =
    await supabaseClient
      .auth
      .getUser();


  if (!data.user) {

    showLoggedOut();

    return;
  }


  currentUser =
    data.user;


  const username =
    currentUser
      .user_metadata
      ?.username ||
    "username";


  const homeUsername =
    document.getElementById(
      "homeUsername"
    );


  const profileUsername =
    document.getElementById(
      "profileUsername"
    );


  if (homeUsername) {

    homeUsername.textContent =
      "@" + username;

  }


  if (profileUsername) {

    profileUsername.textContent =
      "@" + username;

  }


  document
    .querySelector(".app")
    ?.classList
    .add("hidden");


  showHome();

  await loadFriends();

  await loadFriendRequests();

}


/* =========================
   LOGGED OUT
========================= */

function showLoggedOut() {

  currentUser = null;

  selectedFriend = null;


  document
    .querySelector(".app")
    ?.classList
    .remove("hidden");


  document
    .getElementById("authCard")
    ?.classList
    .remove("hidden");


  hideAllScreens();

  showLogin();

}


/* =========================
   HIDE ALL SCREENS
========================= */

function hideAllScreens() {

  const screens = [

    "homeScreen",

    "profileScreen",

    "searchScreen",

    "friendsScreen",

    "friendProfileScreen",

    "chatScreen",

    "gamesScreen"

  ];


  screens.forEach(
    function(id) {

      const element =
        document.getElementById(id);


      if (element) {

        element
          .classList
          .add("hidden");

      }

    }
  );

}


/* =========================
   HOME
========================= */

function showHome() {

  hideAllScreens();

  document
    .getElementById(
      "homeScreen"
    )
    ?.classList
    .remove("hidden");

}


/* =========================
   PROFILE
========================= */

function showProfile() {

  hideAllScreens();

  document
    .getElementById(
      "profileScreen"
    )
    ?.classList
    .remove("hidden");

}


/* =========================
   SEARCH
========================= */

function showSearch() {

  hideAllScreens();

  document
    .getElementById(
      "searchScreen"
    )
    ?.classList
    .remove("hidden");


  loadFriendRequests();

}


/* =========================
   FRIENDS
========================= */

function showFriends() {

  hideAllScreens();

  document
    .getElementById(
      "friendsScreen"
    )
    ?.classList
    .remove("hidden");


  loadFriends();

}


/* =========================
   GAMES
========================= */

function showGames() {

  hideAllScreens();

  const title =
    document.getElementById(
      "gamesTitle"
    );


  if (
    title &&
    selectedFriend
  ) {

    title.textContent =
      "Games with @" +
      selectedFriend.username;

  }


  document
    .getElementById(
      "gamesScreen"
    )
    ?.classList
    .remove("hidden");

}


/* =========================
   FRIEND PROFILE
========================= */

function showFriendProfile(
  friend
) {

  if (friend) {

    selectedFriend =
      friend;

  }


  if (!selectedFriend) {

    showFriends();

    return;
  }


  const username =
    document.getElementById(
      "friendProfileUsername"
    );


  if (username) {

    username.textContent =
      "@" +
      selectedFriend.username;

  }


  hideAllScreens();

  document
    .getElementById(
      "friendProfileScreen"
    )
    ?.classList
    .remove("hidden");

}


/* =========================
   CHAT
========================= */

function openChat() {

  if (!selectedFriend) {

    return;
  }


  window.location.href =
    "chat.html?friend=" +
    encodeURIComponent(
      selectedFriend.id
    );

}


/* =========================
   GAMES WITH FRIEND
========================= */

function openGames() {

  if (!selectedFriend) {

    return;
  }


  showGames();

}


/* =========================
   FRIEND REQUESTS
========================= */

async function loadFriendRequests() {

  if (!currentUser) {

    return;
  }


  const container =
    document.getElementById(
      "friendRequests"
    );


  if (!container) {

    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("friend_requests")
      .select(
        "id, sender_id, receiver_id, status, created_at"
      )
      .eq(
        "receiver_id",
        currentUser.id
      )
      .eq(
        "status",
        "pending"
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    container.innerHTML =
      `<div class="empty-state">
        ${escapeHtml(error.message)}
      </div>`;

    return;
  }


  if (
    !data ||
    data.length === 0
  ) {

    container.innerHTML =
      `<div class="empty-state">
        No pending requests.
      </div>`;

    return;
  }


  let html = "";


  for (
    const request of data
  ) {

    const {
      data: profile
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id, username"
        )
        .eq(
          "id",
          request.sender_id
        )
        .maybeSingle();


    if (!profile) {

      continue;

    }


    html += `

      <div class="request-card">

        <div class="username">
          @${escapeHtml(
            profile.username
          )}
        </div>

        <div class="muted">
          Wants to be your friend.
        </div>

        <div class="request-actions">

          <button
            class="small-button"
            onclick="acceptFriendRequest('${request.id}')"
          >
            Accept
          </button>

          <button
            class="small-button secondary-button"
            onclick="declineFriendRequest('${request.id}')"
          >
            Decline
          </button>

        </div>

      </div>

    `;

  }


  container.innerHTML =
    html ||
    `<div class="empty-state">
      No pending requests.
    </div>`;

}


/* =========================
   SEARCH FRIEND
========================= */

async function searchFriend() {

  clearMessage();


  if (!currentUser) {

    showMessage(
      "Please login first."
    );

    return;
  }


  const input =
    document.getElementById(
      "friendUsernameInput"
    );


  const result =
    document.getElementById(
      "searchResult"
    );


  const username =
    input.value
      .trim()
      .replace(/^@/, "")
      .toLowerCase();


  result.innerHTML = "";


  if (!username) {

    result.innerHTML =
      `<div class="empty-state">
        Enter a username.
      </div>`;

    return;
  }


  if (
    currentUser.user_metadata
      ?.username
      ?.toLowerCase() === username
  ) {

    result.innerHTML =
      `<div class="empty-state">
        That's your own username.
      </div>`;

    return;
  }


  const {
    data: profile,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, username"
      )
      .eq(
        "username",
        username
      )
      .maybeSingle();


  if (error) {

    result.innerHTML =
      `<div class="empty-state">
        ${escapeHtml(error.message)}
      </div>`;

    return;
  }


  if (!profile) {

    result.innerHTML =
      `<div class="result-card">

        <div class="username">
          User not found
        </div>

        <div class="muted">
          Check the username and try again.
        </div>

      </div>`;

    return;
  }


  const {
    data: friendship
  } =
    await supabaseClient
      .from("friendships")
      .select("id")
      .or(

        `and(user_id.eq.${currentUser.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${currentUser.id})`

      )
      .limit(1);


  if (
    friendship &&
    friendship.length > 0
  ) {

    result.innerHTML =
      `<div class="result-card">

        <div class="username">
          @${escapeHtml(
            profile.username
          )}
        </div>

        <div class="muted">
          Already your friend.
        </div>

      </div>`;

    return;
  }


  const {
    data: pending
  } =
    await supabaseClient
      .from("friend_requests")
      .select(
        "id, sender_id, receiver_id"
      )
      .or(

        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${currentUser.id})`

      )
      .eq(
        "status",
        "pending"
      )
      .limit(1);


  if (
    pending &&
    pending.length > 0
  ) {

    const request =
      pending[0];


    const text =
      request.sender_id ===
      currentUser.id

        ? "Friend request already sent."

        : "This user already sent you a request.";


    result.innerHTML =
      `<div class="result-card">

        <div class="username">
          @${escapeHtml(
            profile.username
          )}
        </div>

        <div class="muted">
          ${text}
        </div>

      </div>`;

    return;
  }


  result.innerHTML =
    `<div class="result-card">

      <div class="username">
        @${escapeHtml(
          profile.username
        )}
      </div>

      <div class="muted">
        User found.
      </div>

      <div class="request-actions">

        <button
          class="small-button"
          onclick="sendFriendRequest('${profile.id}')"
        >
          Add Friend
        </button>

      </div>

    </div>`;

}


/* =========================
   SEND FRIEND REQUEST
========================= */

async function sendFriendRequest(
  receiverId
) {

  clearMessage();


  if (!currentUser) {

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("friend_requests")
      .insert({

        sender_id:
          currentUser.id,

        receiver_id:
          receiverId,

        status:
          "pending"

      });


  if (error) {

    showMessage(
      error.message
    );

    return;
  }


  showMessage(
    "Friend request sent."
  );


  const result =
    document.getElementById(
      "searchResult"
    );


  result.innerHTML =
    `<div class="result-card">

      <div class="username">
        Request sent ✓
      </div>

      <div class="muted">
        Your friend request has been sent.
      </div>

    </div>`;

}


/* =========================
   ACCEPT REQUEST
========================= */

async function acceptFriendRequest(
  requestId
) {

  clearMessage();


  if (!currentUser) {

    return;
  }


  const {
    data: request,
    error: requestError
  } =
    await supabaseClient
      .from("friend_requests")
      .select(
        "id, sender_id, receiver_id, status"
      )
      .eq(
        "id",
        requestId
      )
      .eq(
        "receiver_id",
        currentUser.id
      )
      .eq(
        "status",
        "pending"
      )
      .maybeSingle();


  if (requestError) {

    showMessage(
      requestError.message
    );

    return;
  }


  if (!request) {

    showMessage(
      "Friend request not found."
    );

    return;
  }


  const {
    error: updateError
  } =
    await supabaseClient
      .from("friend_requests")
      .update({

        status:
          "accepted"

      })
      .eq(
        "id",
        requestId
      )
      .eq(
        "receiver_id",
        currentUser.id
      );


  if (updateError) {

    showMessage(
      updateError.message
    );

    return;
  }


  const {
    error: friendshipError
  } =
    await supabaseClient
      .from("friendships")
      .upsert(

        [

          {
            user_id:
              currentUser.id,

            friend_id:
              request.sender_id
          },

          {
            user_id:
              request.sender_id,

            friend_id:
              currentUser.id
          }

        ],

        {
          onConflict:
            "user_id,friend_id"
        }

      );


  if (friendshipError) {

    showMessage(
      friendshipError.message
    );

    return;
  }


  showMessage(
    "Friend added successfully."
  );


  await loadFriendRequests();

  await loadFriends();

}


/* =========================
   DECLINE REQUEST
========================= */

async function declineFriendRequest(
  requestId
) {

  clearMessage();


  const {
    error
  } =
    await supabaseClient
      .from("friend_requests")
      .update({

        status:
          "declined"

      })
      .eq(
        "id",
        requestId
      )
      .eq(
        "receiver_id",
        currentUser.id
      );


  if (error) {

    showMessage(
      error.message
    );

    return;
  }


  await loadFriendRequests();


  showMessage(
    "Friend request declined."
  );

}


/* =========================
   LOAD FRIENDS
========================= */

async function loadFriends() {

  if (!currentUser) {

    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("friendships")
      .select(
        "user_id, friend_id, created_at"
      )
      .or(
        `user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    showMessage(
      error.message
    );

    return;
  }


  if (
    !data ||
    data.length === 0
  ) {

    renderEmptyFriends();

    return;
  }


  const friendIds = [];


  data.forEach(
    function(friendship) {

      const friendId =
        friendship.user_id ===
        currentUser.id

          ? friendship.friend_id

          : friendship.user_id;


      if (
        !friendIds.includes(
          friendId
        )
      ) {

        friendIds.push(
          friendId
        );

      }

    }
  );


  const {
    data: profiles,
    error: profileError
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, username"
      )
      .in(
        "id",
        friendIds
      );


  if (profileError) {

    showMessage(
      profileError.message
    );

    return;
  }


  renderFriends(
    profiles || []
  );

}


/* =========================
   RENDER FRIENDS
========================= */

function renderFriends(
  profiles
) {

  const homeContainer =
    document.getElementById(
      "homeFriendsList"
    );


  const friendsContainer =
    document.getElementById(
      "friendsList"
    );


  const profileContainer =
    document.getElementById(
      "profileFriendsList"
    );


  if (
    !profiles ||
    profiles.length === 0
  ) {

    renderEmptyFriends();

    return;
  }


  let homeHtml = "";

  let friendsHtml = "";

  let profileHtml = "";


  profiles.forEach(
    function(friend) {

      const friendJson =
        JSON.stringify({
          id:
            friend.id,
          username:
            friend.username
        })
        .replace(
          /'/g,
          "&#39;"
        );


      homeHtml += `

        <div
          class="home-friend-card"
          onclick='showFriendProfile(${friendJson})'
        >

          <div class="home-friend-avatar">
            👤
          </div>

          <div class="home-friend-info">

            <div class="home-friend-username">
              @${escapeHtml(
                friend.username
              )}
            </div>

            <div class="home-friend-status">

              <span class="offline-dot"></span>

              Offline

            </div>

          </div>

          <div class="home-arrow">
            ›
          </div>

        </div>

      `;


      friendsHtml += `

        <div
          class="home-friend-card"
          onclick='showFriendProfile(${friendJson})'
        >

          <div class="home-friend-avatar">
            👤
          </div>

          <div class="home-friend-info">

            <div class="home-friend-username">
              @${escapeHtml(
                friend.username
              )}
            </div>

            <div class="home-friend-status">
              Friend
            </div>

          </div>

          <div class="home-arrow">
            ›
          </div>

        </div>

      `;


      profileHtml += `

        <div
          class="home-friend-card"
          onclick='showFriendProfile(${friendJson})'
        >

          <div class="home-friend-avatar">
            👤
          </div>

          <div class="home-friend-info">

            <div class="home-friend-username">
              @${escapeHtml(
                friend.username
              )}
            </div>

            <div class="home-friend-status">
              Friend
            </div>

          </div>

          <div class="home-arrow">
            ›
          </div>

        </div>

      `;

    }
  );


  if (homeContainer) {

    homeContainer.innerHTML =
      homeHtml;

  }


  if (friendsContainer) {

    friendsContainer.innerHTML =
      friendsHtml;

  }


  if (profileContainer) {

    profileContainer.innerHTML =
      profileHtml;

  }

}


/* =========================
   EMPTY FRIENDS
========================= */

function renderEmptyFriends() {

  const empty =
    `<div class="empty-state">
      No friends yet.
    </div>`;


  const containers = [

    "homeFriendsList",

    "friendsList",

    "profileFriendsList"

  ];


  containers.forEach(
    function(id) {

      const element =
        document.getElementById(
          id
        );


      if (element) {

        element.innerHTML =
          empty;

      }

    }
  );

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(
  value
) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================
   LOGOUT
========================= */

async function logout() {

  const {
    error
  } =
    await supabaseClient
      .auth
      .signOut();


  if (error) {

    showMessage(
      error.message
    );

    return;
  }


  showLoggedOut();

}


/* =========================
   AUTH STATE
========================= */

supabaseClient
  .auth
  .onAuthStateChange(
    function(
      event,
      session
    ) {

      if (
        event ===
        "SIGNED_OUT"
      ) {

        showLoggedOut();

      }

    }
  );


/* =========================
   SEARCH ENTER
========================= */

const searchInput =
  document.getElementById(
    "friendUsernameInput"
  );


if (searchInput) {

  searchInput.addEventListener(
    "keydown",
    function(event) {

      if (
        event.key ===
        "Enter"
      ) {

        searchFriend();

      }

    }
  );

}


/* =========================
   INITIAL SESSION
========================= */

async function checkSession() {

  const {
    data
  } =
    await supabaseClient
      .auth
      .getSession();


  if (
    data &&
    data.session
  ) {

    await loadUser();

  } else {

    showLoggedOut();

  }

}


checkSession();
