import { Component, OnInit } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../services/data.service';
import gql from 'graphql-tag';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss']
})
export class SubscriptionComponent implements OnInit {
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

  todayVideos = [];
  weekVideos = [];
  monthVideos = [];
  channels = [];
  
  user = null;
  loggedIn: boolean = false;
  users = [];
  
  lastKey: number;
  observer: any;

  //pop up
  playlists = [];
  editedVideoId: any;
  editedPlaylistIdx: number;
  savePlaylist: boolean;
  playlistName: string = "";
  showCreatePlaylist: boolean;

  constructor(private apollo: Apollo, private route: ActivatedRoute, 
    private router: Router, public data: DataService) { 
      this.route.params.subscribe(params => {
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
      this.router.navigate(['/home']);
    }
    else{
      this.getUserFromStorage();
    }
    this.savePlaylist = false;
    this.showCreatePlaylist = false;
    this.todayVideos = [];
    this.weekVideos = [];
    this.monthVideos = [];
    this.getMyActivity();
    this.lastKey = 8;
    this.observer = new IntersectionObserver((entry)=>{
      if(entry[0].isIntersecting){
        let container = document.querySelector(".section-videos");
        for(let i: number = 0; i< 4; i++){
          if(this.lastKey < this.monthVideos.length + this.weekVideos.length + this.todayVideos.length){
            console.log(this.lastKey);
            let div = document.createElement("div");
            let v = document.createElement("app-video-box");
            div.setAttribute("class", "video-box-container");
            if(this.lastKey < this.todayVideos.length){
              v.setAttribute("vid", "this.videos[this.lastKey]");
            }else if(this.lastKey < this.todayVideos.length + this.weekVideos.length){
              v.setAttribute("vid", "this.weekVideos[this.lastKey - this.todayVideos.length]");
            }else if(this.lastKey >= this.todayVideos.length + this.weekVideos.length){
              v.setAttribute("vid", "this.monthVideos[this.lastKey - this.todayVideos.length - this.weekVideos.length]");
            }
            // v.setAttribute("isUser", "this.isUser");
            // v.setAttribute("act", "this.actFromBox($event)");
            div.appendChild(v);
            container.appendChild(div);
            this.lastKey++;
          }
        }
      }
    });
    this.observer.observe(document.querySelector(".footer-scroll"));
  }
  
  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }
  
  getMyActivity(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetMyActivity($from: String!, $cond: String!){
          getMyActivity(from: $from, cond: $cond){
            to
            from
            tipe
          }
        }
      `,
      variables:{
        from: this.user.id,
        cond: "Subscribed",
      }
    }).valueChanges.subscribe(result => {
      this.channels = result.data.getMyActivity;
      console.log(this.channels);
      this.channels.forEach(element => {
        this.getChannelVideos(parseInt(element.to));
      })
    })
  }
  
  getChannelVideos(id){
    this.apollo.query<any>({
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
        channel_id: id,
      }
    }).subscribe(result => {
      let list = [];
      list = result.data.getChannelVideos;
      list.forEach(element => {
        let date = new Date();
        let viDate = new Date(element.year, element.month - 1, element.day);
        if((date.getTime() - viDate.getTime())/(1000 * 3600 * 24) < 1){
          this.todayVideos.push(element);
        }
        if((date.getTime() - viDate.getTime())/(1000 * 3600 * 24) < 7){
          this.weekVideos.push(element);
        }
        if((date.getTime() - viDate.getTime())/(1000 * 3600 * 24) < 31){
          this.monthVideos.push(element);
        }
      });
      console.log(this.todayVideos);
      console.log(this.weekVideos);
      console.log(this.monthVideos);
    })
  }

  showVideo(vi){
    if(vi.visibility != " public"){
      this.lastKey++;
      console.log(this.lastKey);
      return false;
    }
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
