const Peer = window.Peer;
window.__SKYWAY_KEY__ = '6b1e337e-0e14-46e7-8fc2-44af3bb36d8b';

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const localId = document.getElementById('js-local-id');
  const callTrigger = document.getElementById('js-call-trigger');
  const closeTrigger = document.getElementById('js-close-trigger');
  const remoteVideo = document.getElementById('js-remote-stream');
  const remoteId = document.getElementById('js-remote-id');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');
  const toggleCamera = document.getElementById('js-toggle-camera');
  const toggleMicrophone = document.getElementById('js-toggle-microphone');
  const cameraStatus = document.getElementById('camera-status');
  const microphoneStatus = document.getElementById('microphone-status');
  const localVideo = document.getElementById('js-local-stream');

  localVideo.srcObject = localStream;
  localVideo.muted = true; // 自分の音声を自分のスピーカーから聞こえなくする。相手には届く。
  localVideo.playsInline = true;
  localVideo.autoplay = true;


  toggleCamera.addEventListener('click', () => {
    const videoTracks = localStream.getVideoTracks()[0];
    videoTracks.enabled = !videoTracks.enabled;
    cameraStatus.textContent = `カメラ${videoTracks.enabled ? 'ON' : 'OFF'}`;
  });

  toggleMicrophone.addEventListener('click', () => {
    const audioTracks = localStream.getAudioTracks()[0];
    audioTracks.enabled = !audioTracks.enabled;
    microphoneStatus.textContent = `マイク${audioTracks.enabled ? 'ON' : 'OFF'}`;
  });


  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  // Render local stream
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));

  // Register caller handler
  callTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const mediaConnection = peer.call(remoteId.value, localStream);

    mediaConnection.on('stream', async stream => {
      // Render remote stream for caller
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));
  });

  peer.once('open', id => (localId.textContent = id));

  // Register callee handler
  peer.on('call', mediaConnection => {
    mediaConnection.answer(localStream);

    mediaConnection.on('stream', async stream => {
      // Render remote stream for callee
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));
  });

  peer.on('error', console.error);
})();

