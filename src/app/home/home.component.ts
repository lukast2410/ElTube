import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
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

  //user
  users = [];
  user = null;
  loggedIn = false;

  //for get videos
  location: string;
  premium: string;
  visibility: string;
  restrict: string;

  //videos
  video = [];

  //scroll
  lastKey: number;
  observer: any;

  //pop up
  playlists = [];
  editedVideoIdx: number;
  editedPlaylistIdx: number;
  savePlaylist: boolean;
  playlistName: string = "";
  showCreatePlaylist: boolean;

  constructor(private apollo: Apollo, private route: ActivatedRoute, 
    private router: Router, public data: DataService) {
    this.route.params.subscribe(params => {
      // console.log(this.route.parent.snapshot.paramMap.get('name'));
      // console.log(this.channelLink);
      if(localStorage.getItem('users') == null){
        this.users = [];
      }
      else{
        this.getUserFromStorage();
        this.getMyPlaylist();
      }
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

    this.lastKey = 12;
    this.observer = new IntersectionObserver((entry)=>{
      if(entry[0].isIntersecting){
        let container = document.querySelector("#video-container");
        for(let i: number = 0; i< 4; i++){
          if(this.lastKey < this.video.length){
            console.log(this.lastKey);
            let div = document.createElement("div");
            let v = document.createElement("app-video-box");
            div.setAttribute("class", "video-detail-box");
            v.setAttribute("vid", "this.video[this.lastKey]");
            div.appendChild(v);
            container.appendChild(div);
            this.lastKey++;
          }
        }
      }
    });
    this.observer.observe(document.querySelector(".footer-scroll"));

    this.visibility = "public";
    this.premium = "false";
    this.location = "Indonesia";
    this.restrict = "false";
    if(this.user != null){
      this.premium = this.user.premium.toString();
      this.location = this.user.location;
      this.restrict = this.user.restricted.toString();
      console.log(this.user);
    }
    let some = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      hours: new Date().getHours(),
      minutes: new Date().getMinutes(),
      seconds: (new Date().getSeconds()) - 4
    }
    console.log(this.data.formatPublishDate(some))
    this.getVideos();
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }

  getVideos(){
    this.apollo.watchQuery<any>({
      query: gql `
        query VideosFromHome($location: String!, $visibility: String!, $premium: String!, $restrict: String!) {
          videosForHome(location: $location, visibility: $visibility, premium: $premium, restrict: $restrict){
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
      variables: {
        location: this.location,
        visibility: this.visibility,
        premium: this.premium,
        restrict: this.restrict,
      }
    }).valueChanges.subscribe(result => {
      this.video = result.data.videosForHome;
      // this.shuffle(this.video);
      console.log(this.video);
    })
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  //pop up
  actFromBox(event){
    this.editedVideoIdx = event.idx;
    if(event.cond == "save"){
      this.toggleSavePlaylist();
    }
  }
  
  checkPlaylistList(pl): boolean{
    var data = JSON.parse(pl.video_list);
    var found = data.video.map(function(item) { return item.id; }).indexOf(this.video[this.editedVideoIdx].id);
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
      id: this.video[this.editedVideoIdx].id,
      day: new Date().getDate(),
      month: (new Date().getMonth() + 1),
      year: new Date().getFullYear()
    };
    if(event.target.checked){
      data.video.push(json);
      this.updatePlaylist(JSON.stringify(data));
    }else{
      var removeIndex = data.video.map(function(item) { return item.id; }).indexOf(this.video[this.editedVideoIdx].id);
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
        id: this.video[this.editedVideoIdx].id,
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
