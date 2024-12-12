import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText'

export const LobbiesList = ({ lobbies, selected_lobby, set_selected_lobby }) => {
  return (
    <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
      <List component="nav">
        {
          lobbies.map((lobby) => {
            return (
              <ListItemButton
                key={`lobby_name_${lobby.lobby_name}`}
                selected={selected_lobby === lobby.lobby_name}
                onClick={(event) => {
                  // console.log('HERE')
                  set_selected_lobby(lobby.lobby_name)
                }}
              >
                <ListItemText primary={lobby.lobby_name} />
              </ListItemButton>
            )
          })
        }
      </List>
    </Box>
  );
}
