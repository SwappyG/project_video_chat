/* eslint-disable */

import React, { useContext, useEffect, createRef } from 'react';
import { Grid, Typography, Paper, makeStyles } from '@material-ui/core';
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
  const { name, callAccepted, myVideo, userVideo, callEnded, stream, call } = useContext(SocketContext);
  const classes = useStyles();

  console.log(userVideo)
  console.log(callAccepted, callEnded)

  return (
    <Grid container className={classes.gridContainer}>
      {callAccepted && !callEnded && (
        userVideo.map((v) => {
          return (
            <Paper key={v.id} className={classes.paper}>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom>{call.name || 'Name'}</Typography>
                <VideoContainer stream={v} />
              </Grid>
            </Paper>
          )
        })
      )}
    </Grid>
  );
};

export default VideoPlayer;
