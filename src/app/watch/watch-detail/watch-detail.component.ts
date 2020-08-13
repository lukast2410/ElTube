import { Component, OnInit, Input } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-watch-detail',
  templateUrl: './watch-detail.component.html',
  styleUrls: ['./watch-detail.component.scss']
})
export class WatchDetailComponent implements OnInit {
  @Input() video;
  channel;

  channelName: string;
  channelSubs: string;
  channelIcon: string;
  publishDate: string;
  nom: number = 10;

  constructor(private apollo: Apollo, private data: DataService) { }

  ngOnInit(): void {
    this.channelName = "";
    this.channelSubs = "";
    this.channelIcon = "";
    this.publishDate = "";

    this.getChannelByID();
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
        id: this.video.channel_id,
      }
    }).valueChanges.subscribe(result =>{
      this.channel = result.data.getOneChannelByID;
      this.channelName = this.channel.name;
      this.channelIcon = this.channel.icon_path;
      this.channelSubs = this.channel.subscriber;
      this.publishDate = this.data.month[this.video.month] + " " + this.video.day +
        ", " + this.video.year;
      console.log(this.channel)
    })
  }

}
