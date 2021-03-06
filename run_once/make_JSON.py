import json
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("-i",
                    "--input",
                    type=str,
                    required=True,
                    help="Input file. This should be the dump from the Perl script.")

parser.add_argument("-org",
                    "--organism",
                    type=str,
                    required=True,
                    choices=['plasmo', 'anoph'],
                    help="Which organism is this? Must be either plasmo or anoph.")

parser.add_argument("-d",
                    "--dataset",
                    type=str,
                    required=True,
                    choices=['expr', 'ortho', 'mapDict'],
                    help="Which dataset is this? Must be either expr, ortho or mapDict.")

parser.add_argument("-k",
                    "--key",
                    type=int,
                    required=True,
                    help="Which column of the input file to use as keys for the JSON file."
                         " It is zero-indexed.")

parser.add_argument("-v",
                    "--value",
                    type=int,
                    required=True,
                    help="Which column of the input file to use as values for the JSON file."
                         " It is zero-indexed.")

args = parser.parse_args()

input_file = args.input
organism = args.organism
dataset = args.dataset
key = args.key
value = args.value

key_col = int(key)
val_col = int(value)

with open(input_file) as in_file:
    lines = in_file.readlines()

# Most of the stuff that follows is only necessary for expr/ortho.
if dataset == 'mapDict':
    genes_to_ogs = []
    with open('plasmo_gene_to_og_mapping', 'w') as out_file:
        for line in lines:
            words = line.split()
            genes_to_ogs.append({words[key_col]: words[val_col]})
        out_file.write(json.dumps(
            {
                "id": "plasmo_genes_to_ogs",
                "members": genes_to_ogs
            })
        )
# This holds the info for each cluster.
else:
    cluster_dicts = []
    clustering_dict = {}

    # Read the keys column to figure out how many clusters there are in the file.
    nof_clusters = len({line.split()[key_col] for line in lines})

    # This holds the info for the clustering.
    if dataset == 'expr':
        member_type = "gene"
    elif dataset == 'ortho':
        member_type = "OG"

    member_type_dict = {
        "expr": "gene",
        "ortho": "OG"
    }

    clustering_dict = {
        "id": organism + "_" + dataset + "_cluster_%d" % nof_clusters,
        "type": "analysis",
        "member_type": member_type_dict[dataset]
    }

    lines_read = 0
    clusters_processed = []

    for line in lines:
        line = line.split()
        cluster_number = int(line[key_col])
        if cluster_number not in clusters_processed:
            clusters_processed.append(cluster_number)
            cluster_dicts.append(
                {
                    "id": organism + "_" + dataset + "_cluster_%d_%s" % (nof_clusters, line[key_col]),
                    "type": "cluster",
                    "member_ids": [],
                    "name": "Cluster %2d" % (cluster_number + 1),
                    "analysis_id": organism + "_" + dataset + "_cluster_%d" % nof_clusters
                }
            )
            cluster_dicts[-1]['member_ids'].append(line[val_col])
        else:
            cluster_dicts[-1]['member_ids'].append(line[val_col])

    cluster_outfile = "%s_%s_cluster_%02d.json" % (organism, dataset, nof_clusters)
    clustering_outfile = "%s_clustering.json" % organism

    # Write the clusters json file
    with open(cluster_outfile, 'w') as out_file:
        out_file.write(json.dumps(cluster_dicts) + '\n')

    # and the clustering file as well
    if clustering_dict:
        with open(clustering_outfile, 'a') as out_file:
            out_file.write(json.dumps(clustering_dict) + '\n')
