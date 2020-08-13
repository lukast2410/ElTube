import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-queue-list',
  templateUrl: './queue-list.component.html',
  styleUrls: ['./queue-list.component.scss']
})
export class QueueListComponent implements OnInit {
  @Input() video;
  @Input() playlist;
  @Input() idx;
  @Input() selected;
  @Output() delete = new EventEmitter<number>();
  playlistLink = {};
  channel;

  constructor(private apollo: Apollo, public data: DataService) { }

  ngOnInit(): void {
    this.getChannelByID();
    if(this.playlist != null){
      this.playlistLink = { playlist: this.playlist.id };
    }
  }

  deleteQueue(){
    this.delete.emit(this.idx);
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
    })
  }
}
