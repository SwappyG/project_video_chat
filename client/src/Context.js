// /* eslint-disable */

// import React, { createContext, useState, useRef, useEffect, createRef } from 'react';
// import { io } from 'socket.io-client';
// import Peer from 'simple-peer';

// const CAPTION_DWELL_TIME = 3000 // ms

// var http = require('http');

// const SocketContext = createContext();

// const socket = io('http://localhost:5000');
// // const socket = io('https://warm-wildwood-81069.herokuapp.com');

// // Monkey patches the Peer objects to log every event they emit
// // For debugging purposes, remove eventually
// function patchEmitter(emitter) {
//   var oldEmit = emitter.emit;

//   emitter.emit = function() {
//     var emitArgs = arguments;
//     console.log(arguments)
//     oldEmit.apply(emitter, arguments);
//   }
// }

// const ContextProvider = ({ children }) => {
//   const [callAccepted, setCallAccepted] = useState(false);
//   const [callEnded, setCallEnded] = useState(false);
//   const [stream, setStream] = useState();
//   const [name, setName] = useState('');
//   const [call, setCall] = useState({isReceiveingCall: false});
//   const [me, setMe] = useState('');
//   const [captions, setCaptions] = useState([])
//   const captionsref = useRef([])
//   // const [init, setInit] = useState(false)
//   // const [captionTime, setCaptionTime] = useState('')

//   const myVideo = useRef(null);
//   const [userVideo, setUserVideo] = useState([]);
//   const connectionRef = useRef([]);
//   const sendref = useRef(() => {})

//   const send_on_socket = (message) => {
//     console.log(`Sending: ${message}`)
//     socket.emit('text_input', {id: me, message})
//   }

//   // Get available media devices once them
//   // Add callbacks for socket messages
//   useEffect(() => {
//     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
//       .then((curr_stream) => setStream(curr_stream));

//     socket.on('me', (id) => {
//       setMe(id)
//       console.log(`ID: ${id}`)
//       captionsref.current = [...captionsref.current, {id: id, caption: null, caption_time: Date.now()}]
//     })

//     socket.on('callUser', ({ from, name: callerName, signal }) => {
//       setCall({ isReceivingCall: true, from, name: callerName, signal });
//     });
//     socket.on('cc_provider', ({id, message}) => {
//       let caption = captionsref.current.find(cap => cap.id === id)
//       if (caption != null) {
//         console.log(`Got caption for id ${id}, ${message}`)
//         caption.caption = message
//         caption.caption_time = Date.now()
//         setCaptions([...captionsref.current])
//       } else {
//         console.log(`nowhere to send caption for [${id}]`)
//       }
//       // console.log(`got cc message: ${id}: ${message}`)
//     })

//     sendref.current = send_on_socket
//   }, []);

  

//   // Required because myVideo.current may still be null when stream is first set
//   useEffect(() => {
//     if (myVideo.current !== null) {
//       myVideo.current.srcObject = stream
//     }
//   }, [myVideo, stream])

//   // Right now, multiple calls can happen concurrently, but only 1 new call
//   // can be initiated at a time
//   const answerCall = () => {
//     const call_id = call.from
//     captionsref.current.push({id: call_id, caption: null, caption_time: Date.now()})
//     setCallAccepted(true)
//     setCall({ isReceivedCall: false})
//     const peer = new Peer({ initiator: false, trickle: false, stream });
//     patchEmitter(peer)

//     peer.on('signal', (session_description) => {
//       socket.emit('answerCall', { signal: session_description, to: call.from });
//     });

//     peer.on('stream', (currentStream) => {
//       setUserVideo([...userVideo,  {id: call_id, stream: currentStream}])
//     });
    
//     peer.signal(call.signal);

//     connectionRef.current.push(peer);
//   };

//   const callUser = (id) => {
//     const peer = new Peer({ initiator: true, trickle: false, stream });
//     patchEmitter(peer)
  
//     peer.on('signal', (data) => {
//       socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
//     });

//     peer.on('stream', (currentStream) => {
//       console.log('got the stream!!!')
//       setUserVideo([...userVideo, {id, stream: currentStream}])
//     });
    
//     socket.on('callAccepted', (signal) => {
//       setCallAccepted(true)
//       setCall({ isReceivedCall: false})
//       captionsref.current.push({id, caption: null, caption_time: Date.now()})
//       peer.signal(signal);
//     });

//     connectionRef.current.push(peer);
//   };

//   // Right now, all calls are dropped at once
//   // no option to disconnect individual calls
//   const leaveCall = () => {
//     setCallEnded(true);
//     connectionRef.current.forEach((p) => p.destroy());
//     window.location.reload();
//   };

//   return (
//     <SocketContext.Provider value={{
//       call,
//       callAccepted,
//       myVideo,
//       userVideo,
//       stream,
//       name,
//       setName,
//       callEnded,
//       me,
//       callUser,
//       leaveCall,
//       answerCall,
//       captions,
//       send_on_socket,
//     }}
//     >
//       {children}
//     </SocketContext.Provider>
//   );
// };

// export { ContextProvider, SocketContext };


