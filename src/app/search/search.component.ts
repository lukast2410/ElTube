import { Component, OnInit } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../services/data.service';
import gql from 'graphql-tag';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
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

  searchQuery = "";

  playlists = [];
  channels = [];
  videos = [];

  //scroll
  lastKey: number;
  observer: any;

  //show
  displayVideo = true;
  displayPlaylist = true;
  displayChannel = true;
  thisWeek = false;
  thisMonth = false;
  thisYear = false;
   
  user = null;
  loggedIn: boolean = false;
  users = [];

  //pop up
  myPlaylists = [];
  editedVideoId: any;
  editedPlaylistIdx: number;
  savePlaylist: boolean;
  playlistName: string = "";
  showCreatePlaylist: boolean;

  constructor(private apollo: Apollo, private route: ActivatedRoute, private router: Router,
    public data: DataService) {
    this.route.queryParams.subscribe(params => {
      console.log(params);
      if(localStorage.getItem('users') == null){
        this.users = [];
      }
      else{
        this.getUserFromStorage();
        this.getMyPlaylist();
      }
      this.searchQuery = params['search_query'];
      this.displayVideo = true;
      this.displayPlaylist = true;
      this.displayChannel = true;
      this.thisMonth = false;
      this.thisWeek = false;
      this.thisYear = false;
      this.searchVideo();
      this.searchPlaylist();
      this.searchChannel();
    })
   }

  ngOnInit(): void {
    let sort = document.getElementById("sort-container").style;
    sort.display = "none";
    this.savePlaylist = false;
    this.showCreatePlaylist = false;

    this.lastKey = 8;
    this.observer = new IntersectionObserver((entry)=>{
      if(entry[0].isIntersecting){
        let container = document.querySelector("#search-videos-container");
        for(let i: number = 0; i< 4; i++){
          if(this.lastKey < this.videos.length + this.channels.length + this.playlists.length){
            console.log(this.lastKey);
            let div = document.createElement("div");
            if(this.lastKey < this.channels.length){
              //channel
              let v = document.createElement("app-channel-list");
              div.setAttribute("class", "search-channels");
              v.setAttribute("channel", "this.channels[this.lastKey]");
              div.appendChild(v);
            }else if(this.lastKey >= this.channels.length ){
              //playlist
              let v = document.createElement("app-playlist-search");
              div.setAttribute("class", "search-playlists");
              v.setAttribute("playlist", "this.playlists[this.lastKey - this.channels.length]");
              div.appendChild(v);
            }else if(this.lastKey >= this.channels.length + this.playlists.length){
              //video
              let v = document.createElement("app-video-list");
              div.setAttribute("class", "search-videos");
              v.setAttribute("video", "this.videos[this.lastKey - this.channels.length - this.playlists.length]");
              // v.setAttribute("isUser", "this.isUser");
              // v.setAttribute("act", "this.actFromBox($event)");
              div.appendChild(v);
            }
            container.appendChild(div);
            this.lastKey++;
          }
        }
      }
    });
    this.observer.observe(document.querySelector(".footer-scroll"));
  }

  showSort(){
    let sort = document.getElementById("sort-container").style;
    if(sort.display == "none"){
      sort.display = "flex";
    }else{
      sort.display = "none";
    }
  }

  filterSearch(word: string){
    this.displayVideo = false;
    this.displayPlaylist = false;
    this.displayChannel = false;
    this.thisMonth = false;
    this.thisWeek = false;
    this.thisYear = false;
    if(word == 'video'){
      this.displayVideo = true;
      this.lastKey = this.playlists.length + this.channels.length + 8;
    }else if(word == 'channel'){
      this.displayChannel = true;
      this.lastKey = 8;
    }else if(word == 'playlist'){
      this.displayPlaylist = true;
      this.lastKey = this.channels.length + 8;
    }else if(word == 'thisweek'){
      this.displayVideo = true;
      this.thisWeek = true;
      this.lastKey = this.playlists.length + this.channels.length + 8;
    }else if(word == 'thismonth'){
      this.displayVideo = true;
      this.thisMonth = true;
      this.lastKey = this.playlists.length + this.channels.length + 8;
    }else if(word == 'thisyear'){
      this.displayVideo = true;
      this.thisYear = true;
      this.lastKey = this.playlists.length + this.channels.length + 8;
    }
  }

  showVideo(v, index){
    if(!this.displayVideo){
      return false;
    }
    if(index < this.lastKey - this.channels.length - this.playlists.length){
      if(v.visibility == "private"){
        this.lastKey++;
        return false;
      }else{
       let date = new Date();
        if(this.thisMonth){
          if((date.getTime() - new Date(v.year, v.month-1, v.day).getTime())/(1000 * 3600 * 24) < 31){
            return true;
          }else{
            this.lastKey++;
            return false;
          }
        }else if(this.thisWeek){
          if((date.getTime() - new Date(v.year, v.month-1, v.day).getTime())/(1000 * 3600 * 24) < 7){
            return true;
          }else{
            this.lastKey++;
            return false;
          }          
        }else if(this.thisYear){
          if((date.getTime() - new Date(v.year, v.month-1, v.day).getTime())/(1000 * 3600 * 24) < 365){
            return true;
          }else{
            this.lastKey++;
            return false;
          }
        }else{
          return true;
        }
      }
    }else{
      return false;
    }
  }

  showPlaylist(pl, index){
    if(!this.displayPlaylist){
      return false;
    }
    if(index < this.lastKey - this.channels.length && pl.visibility != "private"){
      return true;
    }else if(index < this.lastKey - this.channels.length && pl.visibility == "private"){
      this.lastKey++;
      return false;
    }else{
      return false;
    }
  }

  showChannel(cn, index){
    if(!this.displayChannel){
      return false;
    }
    if(index < this.lastKey){
      return true;
    }else{
      return false;
    }
  }

  checkResult(){
    if(this.channels.length + this.playlists.length + this.videos.length < 1){
      return true;
    }else{
      if(!this.displayChannel && !this.displayPlaylist && this.displayVideo && this.videos.length < 1){
        return true;
      }else if(!this.displayChannel && this.displayPlaylist && !this.displayVideo && this.playlists.length < 1){
        return true;
      }else if(this.displayChannel && !this.displayPlaylist && !this.displayVideo && this.channels.length < 1){
        return true;
      }
      return false;
    }
  }

  searchVideo(){
    this.apollo.watchQuery<any>({
      query: gql `
        query SearchVideo($word: String!){
          searchVideo(word: $word){
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
              hours
              minutes
              seconds
              video_path
              thumbnail_path
              category
              location
              premium
              duration
          }
        }
      `,
      variables:{
        word: this.searchQuery,
      }
    }).valueChanges.subscribe(result => {
      this.videos = result.data.searchVideo;
    })
  }

  searchPlaylist(){
    this.apollo.watchQuery<any>({
      query: gql `
        query SearchPlaylist($word: String!){
          searchPlaylist(word: $word){
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
        word: this.searchQuery,
      }
    }).valueChanges.subscribe(result => {
      this.playlists = result.data.searchPlaylist;
    })
  }

  searchChannel(){
    this.apollo.watchQuery<any>({
      query: gql `
        query SearchChannel($word: String!){
          searchChannel(word: $word){
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
        word: this.searchQuery,
      }
    }).valueChanges.subscribe(result => {
      this.channels = result.data.searchChannel;
    })
  }
  
  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
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
    let data = JSON.parse(this.myPlaylists[this.editedPlaylistIdx].video_list);
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
      this.myPlaylists = result.data.getMyPlaylist;
      // let data = JSON.parse(this.myPlaylists[0].video_list);
      // console.log(data);  
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
        id: this.myPlaylists[this.editedPlaylistIdx].id,
        day: new Date().getDate(),
        month: (new Date().getMonth()+1),
        year: new Date().getFullYear(),
        name: this.myPlaylists[this.editedPlaylistIdx].name,
        views: this.myPlaylists[this.editedPlaylistIdx].views,
        description: this.myPlaylists[this.editedPlaylistIdx].description,
        visibility: this.myPlaylists[this.editedPlaylistIdx].visibility,
        user_id: this.myPlaylists[this.editedPlaylistIdx].user_id,
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
