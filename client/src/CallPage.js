import React, { useContext, useEffect, createRef, useState } from 'react';
import { makeStyles } from '@mui/styles';

// const useStyles = makeStyles((theme) => ({
//   video: {
//     width: '550px',
//     [theme.breakpoints.down('xs')]: {
//       width: '300px',
//     },
//   },
//   gridContainer: {
//     justifyContent: 'center',
//     [theme.breakpoints.down('xs')]: {
//       flexDirection: 'column',
//     },
//   },
//   paper: {
//     padding: '10px',
//     border: '2px solid black',
//     margin: '10px',
//   },
// }))

// This makes sure that we create a new Ref and wait for it to exist before
// assigning the stream. Allows us to dynamically add streams
export const VideoContainer = ({ stream }) => {
  const localVideo = createRef();
  // const classes = useStyles()

  useEffect(() => {
    if (localVideo.current) {
      localVideo.current.srcObject = stream;
    }
  }, [stream, localVideo]);

  return (
    <video playsInline ref={localVideo} autoPlay />
  );
}
