import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-channel-home',
  templateUrl: './channel-home.component.html',
  styleUrls: ['./channel-home.component.scss']
})
export class ChannelHomeComponent implements OnInit {
  GET_PLAYLISTS = gql `
    query GetMyPlaylist($user_id: Int!){
      getMyPlaylist(user_id: $user_id){
        id
        day
        month
        year
        name
        views
        description
        visibility
        user_id
        video_list
      }
    }
  `

  channelLink: string;
  channel;

  recentlyVideos = [];
  randomVideos = [];
  takenVideos = [];
  playlistsChannel = [];
  takenPlaylists = [];
  randomPlaylists = [];
  bestVideo;
  recentKey: number = 4;
  randomKey: number = 8;

  //user
  users = [];
  user = null;
  loggedIn: boolean = false;
  
  //pop up
  playlists = [];
  editedVideoId: any;
  editedPlaylistIdx: number;
  savePlaylist: boolean;
  playlistName: string = "";
  showCreatePlaylist: boolean;
  
  constructor(private apollo: Apollo, private route: ActivatedRoute, private router: Router,
    public data: DataService) {
    this.route.params.subscribe(params => {
      // console.log(this.route.parent.snapshot.paramMap.get('name'));
      this.channelLink = this.route.parent.snapshot.paramMap.get('name');
      // console.log(this.channelLink);
      if(localStorage.getItem('users') == null){
        this.users = [];
      }
      else{
        this.getUserFromStorage();
        this.getMyPlaylist();
      }
      this.getChannelByLink();
    })
   }

  ngOnInit(): void {
    if(localStorage.getItem('users') == null){
      this.users = [];
    }
    else{
      this.getUserFromStorage();
    }
    
    this.savePlaylist = false;
    this.showCreatePlaylist = false;
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }

  toggleSelectionBar(select: string){
    if(select == 'videos'){
      this.router.navigate(['videos'], {relativeTo: this.route.parent});
    }else if(select == 'playlists'){
      this.router.navigate(['playlists'], {relativeTo: this.route.parent});
    }
  }
  
  getBestVideo(){
    var video = this.recentlyVideos[0];
    for(let i=1;i<this.recentlyVideos.length;i++){
      if(video.views < this.recentlyVideos[i].views){
        video = this.recentlyVideos[i];
      }
    }
    this.bestVideo = video;
  }

  getRandomVideos():void{
    let len = this.recentlyVideos.length;
    this.randomVideos = [];
    this.takenVideos = [];
    for(let i = 0; i < 5; i++){
      let random = Math.floor(Math.random() * this.recentlyVideos.length)
      
      if(i == len){
        break
      }

      if(!this.takenVideos.includes(this.recentlyVideos[random].id) && this.recentlyVideos[random].visibility == "public"){        
        this.randomVideos.push(this.recentlyVideos[random])
        this.takenVideos.push(this.recentlyVideos[random].id)
      }
      else{
        if(this.recentlyVideos[random].visibility != "public"){
          len--
        }
        i--
      }
    }
  }

  getRandomPlaylists():void{
    this.randomPlaylists = [];
    this.takenPlaylists = [];
    let len = this.playlistsChannel.length;
    for(let i = 0; i < 3; i++){
      let random = Math.floor(Math.random() * this.playlistsChannel.length)
      
      if(i == len){
        break
      }

      if(!this.takenPlaylists.includes(this.playlistsChannel[random].id) && this.playlistsChannel[random].visibility == "public"){        
        this.randomPlaylists.push(this.playlistsChannel[random])
        this.takenPlaylists.push(this.playlistsChannel[random].id)
      }
      else{
        if(this.playlistsChannel[random].visibility != "public"){
          len--
        }
        i--
      }
    }
  }

  showVideo(v: any, type: string): boolean{
    if(v.visibility != "private"){
      return true;
    } else{
      if(type == "recent"){
        this.recentKey += 1;
      }else if(type == "random"){
        this.randomKey += 1;
      }
      return false;
    }
  }
    
  getChannelByLink(){
    this.apollo.watchQuery<any>({
      query: gql `
        query getChannelByLink($link: String!){
          getOneChannelByLink(link: $link){
            id
            user_id
            name
            description
            stats
            subscriber
            day
            month
            year
            icon_path
            art_path
            channel_link
          }
        }
      `,
      variables:{
        link: this.channelLink,
      }
    }).valueChanges.subscribe(result => {
      this.channel = result.data.getOneChannelByLink;
      this.getChannelVideos();
      this.getChannelPlaylist();
    })
  }

  getChannelVideos(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetChannelVideos($channel_id: Int!){
          getChannelVideos(channel_id: $channel_id){
            id
            channel_id
            title
            description
            views
            like
            dislike
            comment
            visibility
            restrict
            day
            month
            year
            video_path
            thumbnail_path
            category
            location
            premium
            duration  
          }
        }
      `,
      variables: {
        channel_id: this.channel.id,
      }
    }).valueChanges.subscribe(result => {
      this.recentlyVideos = result.data.getChannelVideos;
      console.log(this.recentlyVideos);
      this.getBestVideo();
      this.getRandomVideos();
    })
  }
  
  getChannelPlaylist(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetMyPlaylist($user_id: Int!){
          getMyPlaylist(user_id: $user_id){
            id
            day
            month
            year
            name
            views
            description
            visibility
            user_id
            video_list
          }
        }
      `,
      variables:{
        user_id: this.channel.user_id,
      }
    }).valueChanges.subscribe(result => {
      this.playlistsChannel = result.data.getMyPlaylist;
      this.getRandomPlaylists();
    })
  }

  //pop up
  actFromBox(event){
    this.editedVideoId = event.id;
    if(event.cond == "save"){
      this.toggleSavePlaylist();
    }
  }
  
  checkPlaylistList(pl): boolean{
    var data = JSON.parse(pl.video_list);
    var found = data.video.map(function(item) { return item.id; }).indexOf(this.editedVideoId);
    return found == -1? false : true;
  }

  toggleSavePlaylist(){
    if(this.user == null){
      return;
    }
    this.savePlaylist = !this.savePlaylist;
    this.showCreatePlaylist = false;
  }

  toggleShowCreatePlaylist(){
    this.showCreatePlaylist = !this.showCreatePlaylist;  
  }

  saveToPlaylist(event){
    this.showCreatePlaylist = false;
    this.editedPlaylistIdx = event.target.value;
    let data = JSON.parse(this.playlists[this.editedPlaylistIdx].video_list);
    let json = {
      id: this.editedVideoId,
      day: new Date().getDate(),
      month: (new Date().getMonth() + 1),
      year: new Date().getFullYear()
    };
    if(event.target.checked){
      data.video.push(json);
      this.updatePlaylist(JSON.stringify(data));
    }else{
      var removeIndex = data.video.map(function(item) { return item.id; }).indexOf(this.editedVideoId);
      data.video.splice(removeIndex, 1);
      this.updatePlaylist(JSON.stringify(data));
    }
  }

  validateCreatePlaylist(){
    if(this.playlistName == ""){
      document.getElementById("playlist-name").style.borderBottom = "solid red 2px";
      return;
    }else{
      let playlistVis = (<HTMLInputElement>document.getElementById("select-playlist-privacy")).value;
      let json = { video: [{
        id: this.editedVideoId,
        day: new Date().getDate(),
        month: (new Date().getMonth() + 1),
        year: new Date().getFullYear()
      }]};
      this.createPlaylist(playlistVis.toString(), JSON.stringify(json));
      this.toggleSavePlaylist();
    }
  }

  getMyPlaylist(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetMyPlaylist($user_id: Int!){
          getMyPlaylist(user_id: $user_id){
            id
            day
            month
            year
            name
            views
            description
            visibility
            user_id
            video_list
          }
        }
      `,
      variables:{
        user_id: this.user.id
      }
    }).valueChanges.subscribe(result => {
      this.playlists = result.data.getMyPlaylist;
      let data = JSON.parse(this.playlists[0].video_list);
      console.log(data);  
    })
  }

  createPlaylist(visibility, json){
    this.apollo.mutate({
      mutation: gql `
        mutation CreatePlaylist($user_id: Int!, $name: String!, $views: Int!, $description: String!, $day: Int!, 
          $month: Int!, $year: Int!, $visibility: String!, $video_list: String!){
          createPlaylist(input: {
            user_id: $user_id,
            name: $name,
            views: $views,
            description: $description,
            day: $day,
            month: $month,
            year: $year,
            visibility: $visibility,
            video_list: $video_list
          }){
            id
            day
            month
            year
            name
            views
            description
            visibility
            user_id
            video_list
          }
        }
      `,
      variables:{
        day: new Date().getDate(),
        month: (new Date().getMonth()+1),
        year: new Date().getFullYear(),
        name: this.playlistName,
        views: 0,
        description: "",
        visibility: visibility,
        user_id: this.user.id,
        video_list: json,
      },
      refetchQueries:[{
        query: this.GET_PLAYLISTS
        , variables:{
          user_id: this.user.id
        }
      }]
    }).subscribe(result => {
      console.log(result.data);
      this.playlistName = "";
    })
  }

  updatePlaylist(json){
    this.apollo.mutate({
      mutation: gql `
        mutation UpdatePlaylist($id: ID!, $user_id: Int!, $name: String!, $views: Int!, $description: String!, 
          $day: Int!, $month: Int!, $year: Int!, $visibility: String!, $video_list: String!){
          updatePlaylist(id: $id, input: {
            user_id: $user_id,
            name: $name,
            views: $views,
            description: $description,
            day: $day,
            month: $month,
            year: $year,
            visibility: $visibility,
            video_list: $video_list
          }){
            id
            day
            month
            year
            name
            views
            description
            visibility
            user_id
            video_list
          }
        }
      `,
      variables:{
        id: this.playlists[this.editedPlaylistIdx].id,
        day: new Date().getDate(),
        month: (new Date().getMonth()+1),
        year: new Date().getFullYear(),
        name: this.playlists[this.editedPlaylistIdx].name,
        views: this.playlists[this.editedPlaylistIdx].views,
        description: this.playlists[this.editedPlaylistIdx].description,
        visibility: this.playlists[this.editedPlaylistIdx].visibility,
        user_id: this.playlists[this.editedPlaylistIdx].user_id,
        video_list: json,
      },
      refetchQueries:[{
        query: this.GET_PLAYLISTS
        , variables:{
          user_id: this.user.id
        }
      }]
    }).subscribe(result => {
      console.log("success update playlists");
    })
  }
}
