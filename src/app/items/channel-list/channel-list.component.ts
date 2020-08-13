import { Component, OnInit, Input } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

@Component({
  selector: 'app-channel-list',
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.scss']
})
export class ChannelListComponent implements OnInit {
  @Input() channel;
  subscribed: boolean = false;
  channelVideos = [];
  
  //user
  users = [];
  user = null;
  loggedIn = false;

  //activity
  isUser: boolean = false;
  actProgress: boolean = true;

  GET_ACTIVITY = gql `
    query CheckActivity($cond: String!, $to: String!, $from: String!){
      checkActivity(cond: $cond, to: $to, from: $from){
        to
        from
        tipe
      }
    } `

  GET_CHANNEL = gql `
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
  `
  

  constructor(public data: DataService, private apollo: Apollo, private route: ActivatedRoute, 
    private router: Router) { }

  ngOnInit(): void {
    if(localStorage.getItem('users') == null){
      this.users = [];
    }
    else{
      this.getUserFromStorage();
      if(this.user.id == this.channel.user_id){
        this.isUser = true;
      }
    }
    this.getChannelByID();
    this.getChannelVideos();
  }
  
  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }
  
  getChannelByID(){
    this.apollo.watchQuery<any>({
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
        id: this.channel.id,
      }
    }).valueChanges.subscribe(result =>{
      this.channel = result.data.getOneChannelByID;
      if(this.user != null){
        this.checkActivity(this.channel.id.toString(), this.user.id.toString(), "channel", "check", this.channel.id);
      }
      console.log(this.channel)
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
        channel_id: this.channel.id,
      }
    }).valueChanges.subscribe(result => {
      this.channelVideos = result.data.getChannelVideos;
    })
  }
  
  likeDislikeVideo(word: string){
    if(this.user != null){
      if(word == "subscribe" && this.actProgress){
        this.checkActivity(this.channel.id.toString(), this.user.id.toString(), "channel", "channel", this.channel.id);
      }
    }
  }

  checkActivity(to: string, from: string, cond: string, table: string, id: number){
      this.apollo.query<any>({
        query: gql `
          query CheckActivity($cond: String!, $to: String!, $from: String!){
            checkActivity(cond: $cond, to: $to, from: $from){
              to
              from
              tipe
            }
          }
        `,
        variables:{
          cond: cond,
          to: to,
          from: from,
        }
      }).subscribe(result => {
        this.afterCheckActivity(result.data.checkActivity, cond, table, id);
      })
  }

  afterCheckActivity(obj: any, cond: string, table: string, id: number){
    if(cond == "channel"){
      if(obj.tipe == "Subscribed"){
        console.log("Found you have subscribe it table : " + table);
        if(table == "channel" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.doActivity(table, id, -1);
          this.subscribed = false;
        }else{
          console.log("checking");
          this.subscribed = true;
          this.actProgress = true;
        }
      }else if(obj.tipe == ""){
        console.log("Not found subscribe to this channel")
        if(table == "channel" && this.actProgress){
          this.actProgress = false;
          this.createActivity(cond, this.channel.id, this.user.id, "Subscribed");
          this.doActivity(table, this.channel.id, 1);
          this.subscribed = true;
        }else{
          console.log("check");
          this.subscribed = false;
          this.actProgress = true;
        }
      }
    }
    console.log(this.subscribed);
  }

  createActivity(cond: string, to: string, from: string, tipe: string){
    this.apollo.mutate({
      mutation: gql `
        mutation CreateActivity ($to: String!, $from: String!, $tipe: String!){
          createActivity(input: {to: $to, from: $from, tipe: $tipe}){
            to
            from
            tipe    
          }
        }
      `,
      variables:{
        to: to,
        from: from,
        tipe: tipe,
      },
      refetchQueries:[{
        query: this.GET_ACTIVITY,
        variables:{
          cond: cond,
          to: to,
          from: from,
        }
      }]
    }).subscribe(result => {
      console.log("created activity: " + tipe);
    })
  }

  deleteActivity(cond: string, to: string, from: string, tipe: string){
    this.apollo.mutate({
      mutation: gql `
        mutation DeleteActivity ($to: String!, $from: String!, $tipe: String!){
          deleteActivity(input: {to: $to, from: $from, tipe: $tipe})
        }
      `,
      variables:{
        to: to,
        from: from,
        tipe: tipe,
      },
      refetchQueries:[{
        query: this.GET_ACTIVITY,
        variables:{
          cond: cond,
          to: to,
          from: from,
        }
      }]
    }).subscribe(result => {
      console.log("deleted activity: " + tipe);
    })
  }

  doActivity(table: string, id: number, doing: number){
    this.apollo.mutate({
      mutation: gql `
        mutation DoActivity ($table: String!, $id: ID!, $do: Int!){
          doActivity(table: $table, id: $id, do: $do)
        }
      `,
      variables:{
        table: table,
        id: id,
        do: doing,
      },
      refetchQueries:[{
        query: this.GET_CHANNEL
        ,variables:{
          id: this.channel.id,
        }
      }]
    }).subscribe(result => {
      console.log("activity done: " + table + " added " + doing);
      this.actProgress = true;
    })
  }
}
