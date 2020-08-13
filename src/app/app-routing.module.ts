import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { UploadComponent } from './upload/upload.component';
import { VideoBoxComponent } from './items/video-box/video-box.component';
import { WatchComponent } from './watch/watch.component';
import { RelatedVideoComponent } from './items/related-video/related-video.component';
import { WatchDetailComponent } from './watch/watch-detail/watch-detail.component';
import { CategoryComponent } from './category/category.component';
import { TrendingComponent } from './trending/trending.component';
import { VideoListComponent } from './items/video-list/video-list.component';
import { ChannelComponent } from './channel/channel.component';
import { ChannelHomeComponent } from './channel/channel-home/channel-home.component';
import { ChannelVideosComponent } from './channel/channel-videos/channel-videos.component';
import { ChannelPlaylistsComponent } from './channel/channel-playlists/channel-playlists.component';
import { ChannelCommunityComponent } from './channel/channel-community/channel-community.component';
import { ChannelAboutComponent } from './channel/channel-about/channel-about.component';
import { CommunityPostComponent } from './items/community-post/community-post.component';
import { PlaylistComponent } from './playlist/playlist.component';
import { PlaylistListComponent } from './items/playlist-list/playlist-list.component';
import { CommentComponent } from './items/comment/comment.component';
import { ReplyComponent } from './items/reply/reply.component';
import { ChannelListComponent } from './items/channel-list/channel-list.component';
import { PlaylistBoxComponent } from './items/playlist-box/playlist-box.component';
import { PlaylistSearchComponent } from './items/playlist-search/playlist-search.component';
import { SearchComponent } from './search/search.component';
import { QueueListComponent } from './items/queue-list/queue-list.component';
import { PremiumComponent } from './premium/premium.component';
import { SubscriptionComponent } from './subscription/subscription.component';


const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'upload', component: UploadComponent },
  { path: 'watch/:id', component: WatchComponent },
  { path: 'category/:name', component: CategoryComponent},
  { path: 'trending', component: TrendingComponent},
  { 
    path: 'channel/:name',
    component: ChannelComponent,
    children:[
      { path: '', component: ChannelHomeComponent },
      { path: 'home', component: ChannelHomeComponent },
      { path: 'videos', component: ChannelVideosComponent },
      { path: 'playlists', component: ChannelPlaylistsComponent },
      { path: 'community', component: ChannelCommunityComponent },
      { path: 'about', component: ChannelAboutComponent }
    ]
  },
  { path: 'playlist/:id', component: PlaylistComponent },
  { path: 'search', component: SearchComponent },
  { path: 'premium', component: PremiumComponent },
  { path: 'subscription', component: SubscriptionComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
export const routingComponents = [
  HomeComponent,
  UploadComponent,
  VideoBoxComponent,
  WatchComponent,
  RelatedVideoComponent,
  WatchDetailComponent,
  CategoryComponent,
  TrendingComponent,
  VideoListComponent,
  ChannelComponent,
  ChannelHomeComponent,
  ChannelVideosComponent,
  ChannelPlaylistsComponent,
  ChannelCommunityComponent,
  ChannelAboutComponent,
  CommunityPostComponent,
  PlaylistComponent,
  PlaylistListComponent,
  CommentComponent,
  ReplyComponent,
  ChannelListComponent,
  PlaylistBoxComponent,
  PlaylistSearchComponent,
  SearchComponent,
  QueueListComponent,
  PremiumComponent,
  SubscriptionComponent,
]