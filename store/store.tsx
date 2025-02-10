import { configureStore } from '@reduxjs/toolkit'
import { discoverNearbyDevicesAPI } from '../api/discoverNearbyDevicesAPI'

export const store = configureStore({
  reducer: {
    [discoverNearbyDevicesAPI.reducerPath]: discoverNearbyDevicesAPI.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(discoverNearbyDevicesAPI.middleware),
})


export default store;