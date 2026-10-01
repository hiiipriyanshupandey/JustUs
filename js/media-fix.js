let pendingMediaFile = null;

const mediaFixStyle = document.createElement("style");
mediaFixStyle.textContent = `
#mediaFixPreview{
position:fixed;
inset:0;
background:rgba(0,0,0,.82);
z-index:99999;
display:flex;
align-items:center;
justify-content:center;
padding:20px;
}
.mediaFixCard{
width:100%;
max-width:420px;
background:#18171d;
border-radius:20px;
overflow:hidden;
box-shadow:0 20px 60px rgba(0,0,0,.5);
}
.mediaFixMedia{
width:100%;
max-height:65vh;
display:block;
object-fit:contain;
background:#000;
}
.mediaFixBottom{
padding:14px;
display:flex;
align-items:center;
gap:12px;
}
.mediaFixName{
flex:1;
color:#aaa;
font-size:13px;
overflow:hidden;
text-overflow:ellipsis;
white-space:nowrap;
}
.mediaFixClose{
width:42px;
height:42px;
border:0;
border-radius:50%;
background:#292830;
color:#fff;
font-size:20px;
}
.mediaFixSend{
border:0;
border-radius:12px;
background:#fff;
color:#111;
font-weight:700;
padding:12px 18px;
font-size:15px;
}
.mediaFixSend:disabled{
opacity:.5;
}
`;

document.head.appendChild(mediaFixStyle);

function openBetterMediaPreview(file){

  pendingMediaFile = file;

  const old = document.getElementById("mediaFixPreview");
  if(old) old.remove();

  const box = document.createElement("div");
  box.id = "mediaFixPreview";

  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith("video/");

  box.innerHTML = `
    <div class="mediaFixCard">

      ${
        isVideo
        ? `<video class="mediaFixMedia"
             src="${url}"
             controls
             playsinline></video>`
        : `<img class="mediaFixMedia"
             src="${url}"
             alt="Selected photo">`
      }

      <div class="mediaFixBottom">

        <button class="mediaFixClose"
          onclick="closeBetterMediaPreview()">
          ✕
        </button>

        <div class="mediaFixName">
          ${escapeHtml(file.name)}
        </div>

        <button class="mediaFixSend"
          onclick="sendBetterMedia()">
          ➤ Send
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(box);
}

function closeBetterMediaPreview(){

  const box =
    document.getElementById("mediaFixPreview");

  if(box) box.remove();

  pendingMediaFile = null;
}

async function sendBetterMedia(){

  if(!pendingMediaFile) return;

  const file = pendingMediaFile;

  const button =
    document.querySelector(".mediaFixSend");

  if(button){
    button.disabled = true;
    button.textContent = "Sending...";
  }

  await uploadMedia(file);

  closeBetterMediaPreview();
}

function setupBetterMediaPicker(){

  const input =
    document.getElementById("mediaInput");

  if(!input) return;

  input.onchange = function(){

    const file = input.files[0];

    input.value = "";

    if(!file) return;

    if(
      !file.type.startsWith("image/") &&
      !file.type.startsWith("video/")
    ){
      alert("Please select an image or video.");
      return;
    }

    if(file.size > 50 * 1024 * 1024){
      alert("File is larger than 50 MB.");
      return;
    }

    openBetterMediaPreview(file);
  };
}

setupBetterMediaPicker();
