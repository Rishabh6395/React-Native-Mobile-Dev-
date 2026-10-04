import {Tabs} from 'expo-router'
import {AntDesign, Feather, FontAwesome6} from "@expo/vector-icons"

export default function TabsLayout(){
    return (
        <Tabs screenOptions={{tabBarActiveTintColor: 'black'}}>
            <Tabs.Screen name="index" options={{
                    title: "Home",
                    headerTitle: "Reddit",
                    headerTintColor: "#FF5700",
                    tabBarIcon: ({color}) => <AntDesign name="home" size={24} color={color}/>
                }}/>
                <Tabs.Screen 
                    name="chat"
                    options={{
                        title: 'Chat',
                        tabBarIcon: ({color}) => <Feather name="users" size={24} color={color}/>
                    }}
                />
                <Tabs.Screen 
                    name="create"
                    options={{
                        title: 'Create',
                        tabBarIcon: ({color}) => <FontAwesome6 name="add" size={24} color="black" />
                    }}
                />
                <Tabs.Screen 
                    name="community"
                    options={{
                        title: 'Community',
                        tabBarIcon: ({color}) => <FontAwesome6 name="user-group" size={24} color="black" />
                    }}
                />
                <Tabs.Screen 
                    name="inbox"
                    options={{
                        title: 'Inbox',
                        tabBarIcon: ({color}) => <Feather name="inbox" size={24} color="black" />
                    }}
                />
        </Tabs>
    )
}