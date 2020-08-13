import { Component, OnInit, OnChanges } from '@angular/core';
import { NavbarService } from '../services/navbar.service';
import { Apollo } from 'apollo-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../services/data.service';
import gql from 'graphql-tag';

@Component({
  selector: 'app-side-bar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnChanges {
  user = null;
  loggedIn: boolean = false;
  users = [];
  currentUrl: string;

  playlists = [];
  channels = [];
  subsChannel = [];

  showPlaylist: boolean = false;
  lastKeyPlaylist = 5;
  showSubscription: boolean = false;
  lastKeySubscription = 10;

  //biar bagus aja
  isHome: boolean = false;
  isTrending: boolean = false;
  isSubscription: boolean = false;
  isMusic: boolean = false;
  isGaming: boolean = false;
  isNews: boolean = false;
  isEntertainment: boolean = false;
  isTravel: boolean = false;
  isSport: boolean = false;
  isPremium: boolean = false;
  
  constructor(public navbar: NavbarService, private data: DataService, private router: Router,
    private apollo: Apollo, private route: ActivatedRoute) {
      this.router.events.subscribe((event) => {
        // console.log(event['url']);
        this.sideBarAnimation(window.location.href);
      });
     }

  ngOnInit(): void {
    this.getUserFromStorage();
    // console.log(this.router.getCurrentNavigation());
    // console.log(document.URL.substring(document.URL.lastIndexOf('/')+1))
  }

  ngOnChanges(): void{
    this.currentUrl = document.URL.substring(document.URL.lastIndexOf('/')+1);
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
    if(this.loggedIn){
      this.getMyPlaylist();
      this.getMyActivity();
    }
  }

  check(){
    console.log(this.user);
  }

  sideBarAnimation(word: string){
    // console.log(word);
    this.isHome = false;
    this.isTrending = false;
    this.isSubscription = false;
    this.isMusic = false;
    this.isGaming = false;
    this.isNews = false;
    this.isEntertainment = false;
    this.isTravel = false;
    this.isSport = false;
    this.isPremium = false;
    if(word.includes("/home")){
      this.isHome = true;
    }else if(word.includes("/trending")){
      this.isTrending = true;
    }else if(word.includes("/category/music")){
      this.isMusic = true;
    }else if(word.includes("/category/gaming")){
      this.isGaming = true;
    }else if(word.includes("/category/sport")){
      this.isSport = true;
    }else if(word.includes("/category/entertainment")){
      this.isEntertainment = true;
    }else if(word.includes("/category/news")){
      this.isNews = true;
    }else if(word.includes("/category/travel")){
      this.isTravel = true;
    }else if(word.includes("/subscription")){
      this.isSubscription = true;
    }else if(word.includes("/premium")){
      this.isPremium = true;
    }
  }

  toggleShowPlaylist(){
    this.showPlaylist = !this.showPlaylist;
    if(this.showPlaylist){
      this.lastKeyPlaylist = this.playlists.length;
    }else{
      this.lastKeyPlaylist = 5;
    }
  }

  toggleShowSubscription(){
    this.showSubscription = !this.showSubscription;
    if(this.showSubscription){
      this.lastKeySubscription = this.channels.length;
    }else{
      this.lastKeySubscription = 10;  
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
        user_id: this.user.id,
      }
    }).valueChanges.subscribe(result => {
      this.playlists = result.data.getMyPlaylist;
    })
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
      this.channels = [];
      this.subsChannel = result.data.getMyActivity;
      console.log(this.subsChannel);
      this.subsChannel.forEach(element => {
        this.getChannelByID(element.to);
      })
    })
  }

  getChannelByID(id){
    this.apollo.query<any>({
      query: gql `
        query GetOneChannelByID($id: ID!){
          getOneChannelByID(id: $id){
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
        id: id,
      }
    }).subscribe(result =>{
      let ch = result.data.getOneChannelByID;
      this.channels.push(ch);
      console.log(this.channels);
    })
  }
}
