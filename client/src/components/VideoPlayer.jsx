/* eslint-disable */

import React, { useContext, useEffect, createRef, useState } from 'react';
import { Grid, Typography, Paper, makeStyles, Input, TextField } from '@material-ui/core';
import { SocketContext } from '../Context';

const useStyles = makeStyles((theme) => ({
  video: {
    width: '550px',
    [theme.breakpoints.down('xs')]: {
      width: '300px',
    },
  },
  gridContainer: {
    justifyContent: 'center',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  paper: {
    padding: '10px',
    border: '2px solid black',
    margin: '10px',
  },
}));

// This makes sure that we create a new Ref and wait for it to exist before
// assigning the stream. Allows us to dynamically add streams
const VideoContainer = ({ stream }) => {
  const localVideo = createRef();
  const classes = useStyles()

  useEffect(() => {
    if (localVideo.current) {
      localVideo.current.srcObject = stream;
    }
  }, [stream, localVideo]);

  return (
    <video playsInline ref={localVideo} autoPlay className={classes.video} />
  );
}

const VideoPlayer = () => {
  const { name, me, callAccepted, myVideo, userVideo, callEnded, stream, call, captions, send_on_socket } = useContext(SocketContext);
  const classes = useStyles();

  const [enteredText, setEnteredText] = useState("")

  useEffect(() => {
    console.log(captions)
    console.log(userVideo)
  }, [captions, userVideo])

  return (
    <Grid container className={classes.gridContainer}>
      
      <Paper key={me} className={classes.paper}>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>{call.name || 'Name'}</Typography>
          <VideoContainer stream={stream} />
          <Typography variant="h3" gutterBottom>{captions.find(cap => cap.id === me)?.caption}</Typography>
          <TextField 
            onChange={event => setEnteredText(event.target.value)}
            onKeyDown={event => {
              if (event?.key === "Enter") {
                send_on_socket(enteredText)
                setEnteredText("")
              }
            }}
          ></TextField>
        </Grid>
      </Paper>
      
      {callAccepted && !callEnded && (
        userVideo.map((v) => {
          return (
            <Paper key={v.stream.id} className={classes.paper}>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom>{call.name || 'Name'}</Typography>
                <VideoContainer stream={v.stream} />
                <Typography variant="h3" gutterBottom>{captions.find(cap => cap.id === v.id)?.caption}</Typography>
              </Grid>
            </Paper>
          )
        })
      )}
    </Grid>
  );
};

export default VideoPlayer;
