import { Component, OnInit } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { ActivatedRoute, Router } from '@angular/router';
import gql from 'graphql-tag';

@Component({
  selector: 'app-channel-playlists',
  templateUrl: './channel-playlists.component.html',
  styleUrls: ['./channel-playlists.component.scss']
})
export class ChannelPlaylistsComponent implements OnInit {
  //user
  users = [];
  user = null;
  loggedIn: boolean = false;
  
  channelLink: string;
  channel;
  playlists = [];

  //scroll
  lastKey: number;
  observer: any;

  constructor(private apollo: Apollo, private route: ActivatedRoute, 
    private router: Router) {
    this.route.params.subscribe(params => {
      // console.log(this.route.parent.snapshot.paramMap.get('name'));
      this.channelLink = this.route.parent.snapshot.paramMap.get('name');
      // console.log(this.channelLink);
      if(localStorage.getItem('users') == null){
        this.users = [];
      }
      else{
        this.getUserFromStorage();
      }
      this.getChannelByLink();
    })
   }

  ngOnInit(): void {

    this.lastKey = 8;
    this.observer = new IntersectionObserver((entry)=>{
      if(entry[0].isIntersecting){
        let container = document.querySelector("#channel-playlist-container");
        for(let i: number = 0; i< 4; i++){
          if(this.lastKey < this.playlists.length){
            console.log(this.lastKey);
            let div = document.createElement("div");
            let v = document.createElement("app-playlist-box");
            div.setAttribute("class", "playlist-box-container");
            v.setAttribute("playlist", "this.playlists[this.lastKey]");
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

  showPlaylist(pl){
    if(pl.visibility == "private"){
      this.lastKey++;
      return false;
    }else{
      return true;
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
      console.log("get video for channel videos")
      this.channel = result.data.getOneChannelByLink;
      this.getMyPlaylist();
    })
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
        user_id: this.channel.user_id,
      }
    }).valueChanges.subscribe(result => {
      this.playlists = result.data.getMyPlaylist;
    })
  }
}
