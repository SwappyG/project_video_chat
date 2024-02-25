import React from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { Typography, AppBar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import VideoPlayer from './components/VideoPlayer';
import Sidebar from './components/Sidebar';
import Notifications from './components/Notifications';

import { captions_selector } from '../redux/slices/captions_slice'

const useStyles = makeStyles((theme) => ({
  appBar: {
    borderRadius: 15,
    margin: '30px 100px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '600px',
    border: '2px solid black',

    [theme.breakpoints.down('xs')]: {
      width: '90%',
    },
  },
  image: {
    marginLeft: '15px',
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
}));

import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const CAPTION_DWELL_TIME = 3000 // ms

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


const CaptionsSelector = createSelector(
  (state, { caption_id }) => {
    return state.captions_selector.captions.filter((caption) => { return caption.id === caption_id })
  },
  (ii) => { return ii }
)

const App = () => {
    const classes = useStyles();

    const learned_features_props = useSelector((store_state) => {
      return FeaturesSelector(store_state, {
        is_clicked: state.is_learned_features_clicked,
        features: learned_features
      })
    })

    useEffect(() => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((curr_stream) => setStream(curr_stream));

      socket.on('me', (id) => {
        setMe(id)
        console.log(`ID: ${id}`)
        setCaptions([...captions, {id: id, caption: null, caption_time: Date.now()}])
      })

      socket.on('callUser', ({ from, name: callerName, signal }) => {
        setCall({ isReceivingCall: true, from, name: callerName, signal });
      });

      socket.on('cc_provider', ({id, message}) => {
        console.log(id, message)
        console.log(captions)
        let caption = captions.find(cap => cap.id === id)
        if (caption != null) {
        caption.caption = message
        caption.caption_time = Date.now()
        } else {
        setCaptions(prev_state => { 
            [...prev_state, {id, message}]
        })
        console.log(`nowhere to send caption for [${id}], tried to update captions`)
        }
        console.log(`got cc message: ${id}: ${message}`)
      })

      socket.on('cc_provider', ({id, message}) => {
        console.log(id, message)
        console.log(captions)
        let caption = captions.find(cap => cap.id === id)
        if (caption != null) {
          caption.caption = message
          caption.caption_time = Date.now()
        } else {
          setCaptions(prev_state => { 
            [...prev_state, {id, message}]
          })
          console.log(`nowhere to send caption for [${id}], tried to update captions`)
        }
        console.log(`got cc message: ${id}: ${message}`)
      })
    }, []);

  
    return (
      <div className={classes.wrapper}>
        <AppBar className={classes.appBar} position="static" color="inherit">
          <Typography variant="h2" align="center">Video Chat</Typography>
        </AppBar>
        <VideoPlayer />
        <Sidebar>
          <Notifications />
        </Sidebar>
      </div>
    );
  };
  
  export default App;