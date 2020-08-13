import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {
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

  category: string;
  catName: string;

  cat;
  allTimeVideos = [];
  recentVideos = [];
  thisWeekVideos = [];
  thisMonthVideos = [];
  
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

  constructor(private route: ActivatedRoute, private apollo: Apollo, private router: Router,
    public data: DataService) {
      this.route.params.subscribe(params => {
        this.category = params['name'];
        this.catName = this.category.toUpperCase();
        console.log("category: " + this.category);
        if(localStorage.getItem('users') == null){
          this.users = [];
        }
        else{
          this.getUserFromStorage();
          this.getMyPlaylist();
        }
        this.getOneCategory();
        this.popularAllTime();
        this.popularRecently();
        this.popularThisMonth();
        this.popularThisWeek();
      })
     }

  ngOnInit(): void {
    this.savePlaylist = false;
    this.showCreatePlaylist = false;
  }
  
  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }

  getOneCategory(){
    this.apollo.query<any>({
      query: gql `
        query GetOneCategory($category: String!){
          getOneCategory(category: $category){
            id
            name
            subscriber
          }
        }
      `,
      variables:{
        category: this.category,
      }
    }).subscribe(result => {
      this.cat = result.data.getOneCategory;
    },(error) => {
      this.router.navigate(['/home']);
    })
  }

  popularAllTime(){
    this.apollo.query<any>({
      query: gql `
        query CategoryAllTime($category: String!){
          categoryAllTime(category: $category){
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
        category: this.category,
      }
    }).subscribe(result => {
      this.allTimeVideos = result.data.categoryAllTime;
      console.log("get popular all time from: " + this.category);
    })
  }
  
  popularRecently(){
    this.apollo.query<any>({
      query: gql `
        query CategoryRecently($category: String!){
          categoryRecently(category: $category){
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
        category: this.category,
      }
    }).subscribe(result => {
      this.recentVideos = result.data.categoryRecently;
      console.log("get popular recently from: " + this.category);
    })
  }

  popularThisMonth(){
    this.apollo.query<any>({
      query: gql `
        query CategoryThisMonth($category: String!){
          categoryThisMonth(category: $category){
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
        category: this.category,
      }
    }).subscribe(result => {
      this.thisMonthVideos = result.data.categoryThisMonth;
      console.log("get popular this month from: " + this.category);
    })
  }

  popularThisWeek(){
    this.apollo.query<any>({
      query: gql `
        query CategoryThisWeek($category: String!){
          categoryThisWeek(category: $category){
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
        category: this.category,
      }
    }).subscribe(result => {
      this.thisWeekVideos = result.data.categoryThisWeek;
      console.log("get popular this week from: " + this.category);
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
