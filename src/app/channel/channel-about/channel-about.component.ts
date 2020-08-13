import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-channel-about',
  templateUrl: './channel-about.component.html',
  styleUrls: ['./channel-about.component.scss']
})
export class ChannelAboutComponent implements OnInit {
  GET_CHANNEL = gql `
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
`

  //user
  users = [];
  user = null;
  loggedIn: boolean = false;

  channelLink: string;
  channel;

  editDesc: boolean;
  views;
  channelDesc: string;
  constructor(private apollo: Apollo, private route: ActivatedRoute, private router: Router,
    public data: DataService) {
    this.route.params.subscribe(params => {
      // console.log(this.route.parent.snapshot.paramMap.get('name'));
      this.channelLink = this.route.parent.snapshot.paramMap.get('name');
      // console.log(this.channelLink);
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

    this.editDesc = false;
  }

  toggleEditDesc(flag: boolean){
    this.editDesc = flag;
    if(flag = true){
      console.log(this.channel.description);
      if(this.channel.description != ""){
        (<HTMLInputElement>document.getElementById("edit-channel-desc")).value = this.channel.description;
      }else{
        (<HTMLInputElement>document.getElementById("edit-channel-desc")).placeholder = "Input description";
        console.log("hello");
      }
    }
  }

  editDescription(){
    let text = (<HTMLInputElement>document.getElementById("edit-channel-desc"));
    if(text.value == ""){
      text.placeholder = "Please input the description";
    }else{
      this.channelDesc = text.value;
      this.updateChannel();
      this.toggleEditDesc(false);
    }
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
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
      this.getTotalViews();
    })
  }
  
  updateChannel(){
    this.apollo.mutate({
      mutation: gql `
        mutation UpdateChannel($user_id: Int!, $name: String!, $description: String!, $stats: String!,
          $subscriber: Int!, $day: Int!, $month: Int!, $year: Int!, $icon_path: String!, $art_path: String!,
          $channel_link: String!){
          updateChannel(id: 1, input: {
            user_id: $user_id, 
            name: $name, 
            description: $description, 
            stats: $stats,
            subscriber: $subscriber,
            day: $day,
            month: $month,
            year: $year,
            icon_path: $icon_path
            art_path: $art_path,
            channel_link: $channel_link
          }){
            id
          }
        }
      `,
      variables:{
        user_id: this.channel.user_id, 
        name: this.channel.name, 
        description: this.channelDesc, 
        stats: this.channel.stats,
        subscriber: this.channel.subscriber,
        day: this.channel.day,
        month: this.channel.month,
        year: this.channel.year,
        icon_path: this.channel.icon_path,
        art_path: this.channel.art_path,
        channel_link: this.channel.channel_link
      },
      refetchQueries:[{
        query: this.GET_CHANNEL
        , variables:{
          link: this.channelLink,
        }
      }]
    }).subscribe(result => {
      console.log("success update channel art or icon");
    })
  }

  getTotalViews(){
    this.apollo.query<any>({
      query: gql `
        query GetTotalViews($channel_id: Int!){
          getTotalViews(channel_id: $channel_id){
            views
          }
        }
      `,
      variables:{
        channel_id: this.channel.id
      }
    }).subscribe(result =>{
      this.views = result.data.getTotalViews.views
    })
  }
}
