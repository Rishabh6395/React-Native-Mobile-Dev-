import { Text, View, Image, StyleSheet } from "react-native";
import { formatDistanceToNowStrict } from 'date-fns'
import posts from "../../../assets/data/posts.json"

export default function HomeScreen(){
    const post = posts[0];
    return (
        <View style={{paddingHorizontal: 15, paddingVertical: 10}}>
            <View style={{flexDirection: 'row', gap: 10}}>
                <Image source={{uri: post.group.image}} style={style.imageStyle}/>
                <Text style={{fontWeight: 'bold', fontSize: 15}}>{post.group.name}</Text>
                <Text style={{fontWeight: 'semibold'}}>{formatDistanceToNowStrict(new Date(post.created_at))}</Text>
                <View style={{marginLeft: 'auto'}}>
                    <Text style={style.joinButtonText}>Join</Text>
                </View>
            </View>
            {/* CONTENT */}

            <Text style={style.title}>{post.title}</Text>
            <Image source={{uri: post.image}} style={{width: '100%', aspectRatio: 4/3, borderRadius: 15}}/>
            <Text numberOfLines={4}>{post.description}</Text>

            {/* FOOTER */}
            <View style={{flexDirection: 'row'}}>

            </View>
        </View>
    )
}

const style = StyleSheet.create({
    joinButtonText: {
        backgroundColor: '#0d469b',
        color: "white",
        paddingVertical: 2,
        paddingHorizontal: 7,
        borderRadius: 10,
        fontWeight: 'bold'
    },
    imageStyle: {
        width: 40,
        height: 40,
        borderRadius: 10
    },
    title:{
        fontWeight: 'bold',
        fontSize: 17,
        letterSpacing: 0.5
    }
})