import socketio
import time

if __name__=="__main__":
    with socketio.SimpleClient() as sio:
        sio.connect('http://localhost:5000')
        sio.emit('cc_provider_get_socket_ids', {})
        time.sleep(0.1)
        
        caller_id = sio.input_buffer[-1][-1]['callers'][0]
        print(caller_id)
        
        while True:
            try:
                print(sio.receive(1))
            except:
                print(sio.input_buffer)
                pass
            time.sleep(1)
            # raw_input = input("write what to display: \n\n")
            # message = sio.input_buffer[-1]
            # if message[0] == 'cc_provider_get_socket_ids':
            #     for ii, caller_id in enumerate(message[1]['callers']):
            #         sio.emit('cc_provider', {'id': caller_id, 'message': f'{ii} says: {raw_input}'})

            
