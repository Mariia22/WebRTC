import Signal from "./api.js";
const localVideo = document.querySelector('#localVideo');
const remoteVideo = document.querySelector('#remoteVideo');
const start = document.querySelector('#startButton');
const call = document.querySelector('#callButton');
const hangUp = document.querySelector('#hangupButton');
const servers = null; //STUN servers
const api = new Signal(); //abstract signaling server
let localPeerConnection, remotePeerConnection = null;
let stream;

  async function captureVideo() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({video:true})
      localVideo.srcObject = mediaStream;
      stream = mediaStream;
    }
    catch(error){
      alert(`getUserMedia() error: ${error}`);
  }}

  async function callToRemotePeer() {
    try {
      //LOCAL API
      const videoTrack = stream.getVideoTracks()[0];
      localPeerConnection = new RTCPeerConnection(servers);
      localPeerConnection.addTrack(videoTrack,stream);
      localPeerConnection.addEventListener('icecandidate', (event)=>{
        if(event.candidate){
          api.send({event: 'LOCAL_CANDIDATE',payload:event.candidate })
        }
      })
      localPeerConnection.createOffer().then((description)=>{
        localPeerConnection.setLocalDescription(description)
        api.send({event: 'LOCAL_DESCRIPTION',payload:description })
      }).catch ((error) => alert(`createOffer() error: ${error.name}`));
      
      api.on('REMOTE_DESCRIPTION',(description)=>{
        localPeerConnection.setRemoteDescription(description);
      })
      
      api.on('REMOTE_CANDIDATE',(candidate)=>{
        localPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      })

      //REMOTE API

        remotePeerConnection = new RTCPeerConnection(servers);
        api.on('LOCAL_DESCRIPTION', (description)=>{
          remotePeerConnection.setRemoteDescription(description);

         remotePeerConnection.addEventListener('icecandidate', (event)=>{
           if(event.candidate){
             api.send({event: 'REMOTE_CANDIDATE',payload:event.candidate })
            }
          })

          remotePeerConnection.addEventListener('track', event =>{
            remoteVideo.srcObject = event.streams[0];
          })
  
          api.on('LOCAL_CANDIDATE',(candidate)=>{
            remotePeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          })
  
          remotePeerConnection.createAnswer().then((description)=>{
            remotePeerConnection.setLocalDescription(description)
            api.send({event: 'REMOTE_DESCRIPTION',payload:description })
          })
        })
    }
  catch(error){
    alert(`callToRemotePeer error: ${error}`);
  }}

  start.addEventListener('click', ()=>{
    captureVideo();
  })

  call.addEventListener('click',()=> {
    callToRemotePeer();
  })

  hangUp.addEventListener('click', ()=>{
    localPeerConnection.close();
    remotePeerConnection.close();
  })






