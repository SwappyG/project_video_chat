import React, { createContext, useState, useRef, useEffect, createRef } from 'react';
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { Container } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';

import { LobbiesList } from './components/lobbies_list';

export const SplashPage = ({ on_create_lobby_button, on_join_lobby_button, lobbies, selected_lobby, set_selected_lobby, set_new_lobby_name }) => {
  return (
    <Container>
      <Grid2 xs={12}>
        <TextField
          id="standard-basic"
          label="Standard"
          variant="standard"
          // value={new_lobby_name}
          onChange={(event) => set_new_lobby_name(event.target.value)}
        />
      </Grid2>
      <Grid2 xs={12}>
        <Button variant="contained" size="large" onClick={on_create_lobby_button}>
          Create a Lobby
        </Button>
        <Button variant="contained" size="large" onClick={on_join_lobby_button}>
          Join a Lobby
        </Button>
      </Grid2>
      <Grid2 xs={12}>
        <LobbiesList lobbies={lobbies} selected_lobby={selected_lobby} set_selected_lobby={set_selected_lobby} />
      </Grid2>
    </Container>
  )
}
