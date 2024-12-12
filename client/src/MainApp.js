/* eslint-disable */

import React, { createContext, useState, useRef, useEffect, createRef } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { Button, Container, Grid } from '@mui/material';
import { SplashPage } from './SplashPage';
import { VideoContainer } from './CallPage';

const socket = io('http://localhost:5000');

// Monkey patches the Peer objects to log every event they emit
// For debugging purposes, remove eventually
function patchEmitter(emitter) {
  var oldEmit = emitter.emit;

  emitter.emit = function() {
    var emitArgs = arguments;
    console.log(arguments)
    oldEmit.apply(emitter, arguments);
  }
}

export const MainApp = ({ }) => {
  const [selected_lobby, set_selected_lobby] = useState("")
  const [lobbies, set_lobbies] = useState([])
  const [new_lobby_name, set_new_lobby_name] = useState("")
  const [stream, set_stream] = useState(null)
  const [response, set_response] = useState(null)
  const response_handler = useRef((response) => {console.log(response)})
  const [my_socket_id, set_my_socket_id] = useState('')

  const callers = useRef([])
  const [force_update, set_force_update] = useState(0)

  const [active_lobby, set_active_lobby] = useState(null)

  const my_video = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((curr_stream) => {
        console.log(curr_stream)
        set_stream(curr_stream)
        my_video.current = curr_stream
      });

    socket.on('connection_confirmation', ({ socket_id, lobbies }) => {
      set_my_socket_id(socket_id)
      set_lobbies(lobbies)
      console.log('callback: connection_confirmation')
      console.log({socket_id, lobbies})
    })

    socket.on('response', (response) => {
      console.log('got a response, setting response')
      set_response(response)
    })

    socket.on('server_update', (data) => {
      console.log('callback: server_update')
      console.log(data)
      if ('lobbies' in data) {
        set_lobbies(data.lobbies)
      }
    })

    socket.on('lobby_update', (data) => {
      if (data?.disconnect) {
        const this_caller = callers.current.find(caller => caller.participant.socket_id === data.disconnect.socket_id)
        if (this_caller) {
          this_caller.peer.destroy()
          callers.current = callers.current.filter(caller => caller.participant.socket_id !== data.disconnect.socket_id)
          set_force_update(Math.random())
        }
      }
    })

    socket.on('recv_signal', ({ participant, signal }) => {
      console.log(`callback - recv signal`)
      const caller_index = callers.current.findIndex((caller) => caller.participant.socket_id === participant.socket_id)
      if (caller_index === -1) {
        console.log(`Received signal from new participant [${participant.socket_id}]`)

        const peer = new Peer({ initiator: false, trickle: false, stream: my_video.current });
        patchEmitter(peer)

        peer.on('signal', (signal) => {
          console.log(`received 2nd signal from peer [${participant.socket_id}]. Relaying back...`)
          socket.emit('relay_signal', { socket_id: participant.socket_id, signal: signal });
        });

        peer.on('stream', (stream) => {
          console.log(`received 2nd stream from peer [${participant.socket_id}]`)
          callers.current.push({
            peer: peer,
            participant: participant,
            stream: stream
          })
          set_force_update(Math.random())
        })
        
        console.log(`Signaling back to peer [${participant.socket_id}]`)
        peer.signal(signal)
      } else {
        console.log(`Received response from participant [${participant.socket_id}]`)
        callers.current[caller_index].peer.signal(signal)
        set_force_update(Math.random())
      }
    })
  }, []);

  useEffect(() => {
    my_video.current = stream
    console.log(my_video)
  }, [stream])

  useEffect(() => {
    console.log(callers)
  }, [force_update])

  const on_create_lobby_button = (event) => {
    response_handler.current = (response) => {
      console.log('on button click response handler called')
      console.log(response)
      if (response.request !== 'create_lobby') {
        return
      }

      set_new_lobby_name("")
    }
    socket.emit('create_lobby', {
      'lobby_name': new_lobby_name
    })
  }

  const on_join_lobby_button = (event) => {
    const sel_lobby = selected_lobby
    response_handler.current = (response) => {
      console.log('on join lobby response handler called')
      console.log(response)
      if (response.request !== 'join_lobby') {
        return
      }

      if (!response.result) {
        console.log(`Failed to join lobby [${sel_lobby}]`)
        return
      }

      set_active_lobby(response.data)

      response.data.participants.forEach((participant) => {
        if (participant.socket_id === my_socket_id) {
          return
        }
        console.log(`creating a peer for [${participant.socket_id}]`)
        const peer = new Peer({ initiator: true, trickle: false, stream });
        patchEmitter(peer)
        
        console.log(`adding peer [${participant.socket_id}] to callers list`)
        callers.current.push({
          peer: peer,
          participant: participant,
          stream: null
        })

        peer.on('signal', (data, socket_id=participant.socket_id) => {
          console.log(`received signal data for peer [${socket_id}]. Relaying to peer...`)
          socket.emit('relay_signal', { socket_id: socket_id, signal: data })
        });

        peer.on('stream', (current_stream, socket_id=participant.socket_id) => {
          console.log(`received stream from peer [${socket_id}]`)
          const caller_index = callers.current.findIndex(caller => caller.participant.socket_id === socket_id)
          if (caller_index === -1) {
            console.log(`Received stream from caller ${socket_id}, but not in current callers list`)
            return
          }
          
          callers.current[caller_index].stream = current_stream
          set_force_update(Math.random())
        })
      })
    }

    socket.emit('join_lobby', {
      'lobby_name': sel_lobby
    })
  }

  useEffect(() => {
    console.log('got new response in useeffect, calling handler')
    response_handler.current({...response})
    response_handler.current = ((response) => {console.log(response)})
  }, [response])

  const on_leave_call = (event) => {
    socket.emit('leave_lobby')
    set_active_lobby(null)
    callers.current.forEach(caller => { caller.peer.destroy() })
  }

  return (
    <>
      {
        !active_lobby ? 
          <SplashPage 
            on_create_lobby_button={on_create_lobby_button}
            on_join_lobby_button={on_join_lobby_button}
            lobbies={lobbies}
            selected_lobby={selected_lobby}
            set_selected_lobby={set_selected_lobby}
            set_new_lobby_name={set_new_lobby_name}
          /> :
          <Container>
            <Button variant="contained" size="large" onClick={on_leave_call}>
              Leave Call
            </Button>
            <Grid item xs={4} >
              <VideoContainer stream={stream} />
            </Grid>
            {
              callers.current.map(caller => {
                return (
                  <Grid item xs={4} >
                    <VideoContainer key={`video_${caller.participant.socket_id}`} stream={caller.stream} />
                  </Grid>
                )
              })
            }
          </Container>
      }
    </>
  )
};



